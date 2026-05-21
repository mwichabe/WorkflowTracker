from django.urls import path
from django.http import JsonResponse
from ninja import NinjaAPI
from applications.api import router as apps_router
from accounts.api import router as auth_router, admin_router

api = NinjaAPI(
    title="WorkflowTracker API",
    version="1.0.0",
    description="""
## WorkflowTracker API

A structured workflow platform for submitting, reviewing, and deciding on applications —
with JWT authentication, role-based access control, and in-app notifications.

---

### Authentication

All protected endpoints require a **Bearer JWT token** in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

Obtain a token via **POST /api/auth/register** or **POST /api/auth/login**.
Tokens are valid for **7 days**.

---

### Roles & Permissions

| Role | How to obtain | Permissions |
|------|--------------|-------------|
| **Guest** | No account needed | Read-only: public application list |
| **User** | Register an account | Create & manage own applications |
| **Admin** | Approved via super admin | Review applications, record decisions, view all users |
| **Super Admin** | Django `createsuperuser` | All of the above + manage admin role requests |

---

### Application Lifecycle

```
Draft ──► Submitted ──► Under Review ──► Approved
                                     ──► Rejected
                                     ──► Need More Information ──► (edit) ──► Submitted ──► …
```

- **Draft** — created by a user, editable
- **Submitted** — locked, queued for admin review; notifies all admins
- **Under Review** — admin has opened the application
- **Approved / Rejected / Need More Information** — final or loop-back decision; notifies the owner
""",
    docs_url="/docs",
)
api.add_router("/applications", apps_router)
api.add_router("/auth", auth_router)
api.add_router("/admin", admin_router)


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/", api.urls),
    path("health/", health),
]
