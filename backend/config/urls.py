from django.urls import path
from django.http import JsonResponse
from ninja import NinjaAPI
from applications.api import router as apps_router
from accounts.api import router as auth_router, admin_router

api = NinjaAPI(title="Workflow Tracker API", version="1.0.0")
api.add_router("/applications", apps_router)
api.add_router("/auth", auth_router)
api.add_router("/admin", admin_router)


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/", api.urls),
    path("health/", health),
]
