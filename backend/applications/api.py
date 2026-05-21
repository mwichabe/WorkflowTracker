from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from django.utils import timezone
from typing import List, Optional
from .models import Application, ApplicationStatus, ApplicationType
from accounts.api import jwt_auth, get_optional_user

router = Router(tags=["Applications"])


# ── Schemas ───────────────────────────────────────────────

class ApplicationCreateSchema(Schema):
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str


class ApplicationUpdateSchema(Schema):
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    company_name: Optional[str] = None
    application_type: Optional[str] = None
    description: Optional[str] = None


class ReviewerDecisionSchema(Schema):
    decision: str
    reviewer_comment: str


class ApplicationOut(Schema):
    id: int
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str
    status: str
    reviewer_comment: str
    submitted_by_id: Optional[int] = None
    submitted_by_username: Optional[str] = None
    reviewed_by_username: Optional[str] = None
    created_at: str
    updated_at: str
    submitted_at: Optional[str] = None
    reviewed_at: Optional[str] = None

    @staticmethod
    def resolve_submitted_by_id(obj):
        return obj.submitted_by_id

    @staticmethod
    def resolve_submitted_by_username(obj):
        return obj.submitted_by.username if obj.submitted_by else None

    @staticmethod
    def resolve_reviewed_by_username(obj):
        return obj.reviewed_by.username if obj.reviewed_by else None

    @staticmethod
    def resolve_created_at(obj):
        return obj.created_at.isoformat() if obj.created_at else None

    @staticmethod
    def resolve_updated_at(obj):
        return obj.updated_at.isoformat() if obj.updated_at else None

    @staticmethod
    def resolve_submitted_at(obj):
        return obj.submitted_at.isoformat() if obj.submitted_at else None

    @staticmethod
    def resolve_reviewed_at(obj):
        return obj.reviewed_at.isoformat() if obj.reviewed_at else None


class ErrorOut(Schema):
    detail: str


# ── Helpers ───────────────────────────────────────────────

def _notify_owner(app, title, message):
    """Send an in-app notification to the application owner."""
    if not app.submitted_by:
        return
    from accounts.models import Notification
    Notification.objects.create(
        user=app.submitted_by,
        type=Notification.STATUS_UPDATE,
        title=title,
        message=message,
    )


def _is_admin(user):
    return user and (user.is_staff or user.is_superuser)


# ── Endpoints ─────────────────────────────────────────────

@router.post(
    "/",
    response={201: ApplicationOut, 400: ErrorOut, 401: ErrorOut},
    auth=jwt_auth,
    summary="Create a new application (Draft)",
)
def create_application(request, payload: ApplicationCreateSchema):
    """
    Create a new application in **Draft** status.

    The application is automatically linked to the authenticated user
    (`submitted_by`). It remains editable until submitted.

    **application_type** must be one of:
    - `Recordation`
    - `Renewal`
    - `Change of Ownership`
    - `Change of Name`
    - `Discontinuation`

    **Requires:** `Authorization: Bearer <token>`
    """
    if payload.application_type not in [t.value for t in ApplicationType]:
        return 400, {"detail": f"Invalid application type: {payload.application_type}"}
    app = Application.objects.create(**payload.dict(), submitted_by=request.auth)
    return 201, app


@router.get(
    "/",
    response=List[ApplicationOut],
    summary="List applications",
)
def list_applications(request, status: Optional[str] = None):
    """
    Return a list of applications.

    **Visibility rules:**
    - **Guest / unauthenticated** — all applications (read-only overview)
    - **Authenticated user** — only their own applications
    - **Admin / Super Admin** — all applications

    **Query parameter:**
    - `status` — filter by status value (e.g. `?status=Submitted`)

    No `Authorization` header required, but results are scoped when a valid
    token is provided.
    """
    user = get_optional_user(request)
    qs = Application.objects.select_related("submitted_by", "reviewed_by").all()
    if user and not _is_admin(user):
        qs = qs.filter(submitted_by=user)
    if status:
        qs = qs.filter(status=status)
    return list(qs)


@router.get(
    "/{app_id}",
    response={200: ApplicationOut, 404: ErrorOut},
    summary="Get a single application",
)
def get_application(request, app_id: int):
    """
    Return full details of a single application by its numeric ID.

    Returns `404` if the application does not exist.
    No authentication required.
    """
    app = get_object_or_404(
        Application.objects.select_related("submitted_by", "reviewed_by"), id=app_id
    )
    return 200, app


@router.put(
    "/{app_id}",
    response={200: ApplicationOut, 400: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Update a Draft or Need More Information application",
)
def update_application(request, app_id: int, payload: ApplicationUpdateSchema):
    """
    Update fields on an existing application.

    **Allowed statuses:** `Draft`, `Need More Information`
    All other statuses are locked and will return `400`.

    **Permission:** the owner or any admin may edit.
    All fields in the payload are optional — only provided fields are updated.

    **Requires:** `Authorization: Bearer <token>`
    """
    app = get_object_or_404(Application, id=app_id)

    if app.status not in [ApplicationStatus.DRAFT, ApplicationStatus.NEED_MORE_INFORMATION]:
        return 400, {"detail": "Only Draft or Need More Information applications can be edited."}

    user = request.auth
    if not _is_admin(user) and app.submitted_by_id != user.id:
        return 403, {"detail": "You can only edit your own applications."}

    for field, value in payload.dict(exclude_none=True).items():
        if field == "application_type" and value not in [t.value for t in ApplicationType]:
            return 400, {"detail": f"Invalid application type: {value}"}
        setattr(app, field, value)

    app.save()
    return 200, app


@router.post(
    "/{app_id}/submit",
    response={200: ApplicationOut, 400: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Submit a Draft application for review",
)
def submit_application(request, app_id: int):
    """
    Transition an application from **Draft** → **Submitted**.

    Once submitted the application is locked for editing.
    All active admins receive an in-app notification.

    **Allowed status:** `Draft` only.
    **Permission:** the application owner only (admins cannot submit on behalf of a user).

    **Requires:** `Authorization: Bearer <token>`
    """
    app = get_object_or_404(Application, id=app_id)

    if app.status != ApplicationStatus.DRAFT:
        return 400, {"detail": "Only Draft applications can be submitted."}

    user = request.auth
    if not _is_admin(user) and app.submitted_by_id != user.id:
        return 403, {"detail": "You can only submit your own applications."}

    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = timezone.now()
    app.save()

    from django.contrib.auth.models import User as DjangoUser
    from accounts.models import Notification
    admins = DjangoUser.objects.filter(is_staff=True, is_active=True)
    for admin in admins:
        Notification.objects.create(
            user=admin,
            type=Notification.STATUS_UPDATE,
            title="New Application Submitted",
            message=f"{app.applicant_name} submitted application {app.tracking_number} for review.",
        )
    return 200, app


@router.post(
    "/{app_id}/start-review",
    response={200: ApplicationOut, 400: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Start reviewing a Submitted application",
)
def start_review(request, app_id: int):
    """
    Transition an application from **Submitted** → **Under Review**.

    Records the reviewing admin on the application (`reviewed_by`).
    The application owner is notified via in-app notification.

    **Allowed status:** `Submitted` only.
    **Requires:** Admin or Super Admin role.
    """
    if not _is_admin(request.auth):
        return 403, {"detail": "Admin access required to start a review."}

    app = get_object_or_404(Application, id=app_id)

    if app.status != ApplicationStatus.SUBMITTED:
        return 400, {"detail": "Only Submitted applications can move to Under Review."}

    app.status = ApplicationStatus.UNDER_REVIEW
    app.reviewed_by = request.auth
    app.save()

    _notify_owner(
        app,
        "Application Under Review",
        f"Your application {app.tracking_number} is now under review by an admin.",
    )
    return 200, app


@router.post(
    "/{app_id}/decision",
    response={200: ApplicationOut, 400: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Record a decision on an Under Review application",
)
def record_decision(request, app_id: int, payload: ReviewerDecisionSchema):
    """
    Record a final (or loop-back) decision on an **Under Review** application.

    **decision** must be one of:
    - `Approved` — application accepted; owner notified
    - `Rejected` — application declined; **reviewer_comment required**
    - `Need More Information` — returns to user for editing; **reviewer_comment required**

    After a `Need More Information` decision the owner can edit and re-submit
    the application, restarting the review cycle.

    The `reviewed_at` timestamp and `reviewed_by` admin are recorded.
    The application owner receives an in-app notification with the decision details.

    **Allowed status:** `Under Review` only.
    **Requires:** Admin or Super Admin role.
    """
    if not _is_admin(request.auth):
        return 403, {"detail": "Admin access required to record a decision."}

    app = get_object_or_404(Application, id=app_id)

    if app.status != ApplicationStatus.UNDER_REVIEW:
        return 400, {"detail": "Only Under Review applications can receive a decision."}

    valid_decisions = [
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.NEED_MORE_INFORMATION,
    ]
    if payload.decision not in [s.value for s in valid_decisions]:
        return 400, {"detail": f"Invalid decision. Must be one of: {', '.join(s.value for s in valid_decisions)}"}

    if payload.decision in [ApplicationStatus.REJECTED, ApplicationStatus.NEED_MORE_INFORMATION]:
        if not payload.reviewer_comment.strip():
            return 400, {"detail": "A comment is required for Rejected or Need More Information decisions."}

    app.status = payload.decision
    app.reviewer_comment = payload.reviewer_comment
    app.reviewed_at = timezone.now()
    app.reviewed_by = request.auth
    app.save()

    status_messages = {
        ApplicationStatus.APPROVED: f"Your application {app.tracking_number} has been approved!",
        ApplicationStatus.REJECTED: f"Your application {app.tracking_number} has been rejected. Reason: {payload.reviewer_comment}",
        ApplicationStatus.NEED_MORE_INFORMATION: f"Your application {app.tracking_number} requires more information: {payload.reviewer_comment}",
    }
    _notify_owner(
        app,
        f"Application {payload.decision}",
        status_messages.get(payload.decision, f"Your application status has been updated to: {payload.decision}"),
    )
    return 200, app


@router.delete(
    "/{app_id}",
    response={204: None, 403: ErrorOut, 404: ErrorOut},
    auth=jwt_auth,
    summary="Delete an application",
)
def delete_application(request, app_id: int):
    """
    Permanently delete an application.

    **Permission:** the application owner or any admin.
    There is no status restriction — any application can be deleted by its owner or an admin.

    Returns `204 No Content` on success.

    **Requires:** `Authorization: Bearer <token>`
    """
    app = get_object_or_404(Application, id=app_id)
    user = request.auth
    if not _is_admin(user) and app.submitted_by_id != user.id:
        return 403, {"detail": "You can only delete your own applications."}
    app.delete()
    return 204, None
