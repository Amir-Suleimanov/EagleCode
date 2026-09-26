from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.selectors import athletes, cities_with_rating
from apps.users.services import register_athlete
from common.permissions import IsSelfOrAdmin

from .serializers import (
    AthleteSerializer,
    CitySerializer,
    LoginSerializer,
    RefreshTokenSerializer,
    RegisterSerializer,
    SessionUserSerializer,
)


def auth_payload(user):
    refresh = RefreshToken.for_user(user)
    return {
        "user": SessionUserSerializer(user).data,
        "accessToken": str(refresh.access_token),
        "refreshToken": str(refresh),
    }


class RegisterView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = register_athlete(
            full_name=serializer.validated_data["fullName"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            city=serializer.validated_data["city"],
            organization=serializer.validated_data["organization"],
        )
        return Response(auth_payload(user), status=status.HTTP_201_CREATED)


class LoginView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if not user:
            raise AuthenticationFailed("Неверный email или пароль")
        return Response(auth_payload(user))


class RefreshView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RefreshTokenSerializer

    def post(self, request):
        request_serializer = self.get_serializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        serializer = TokenRefreshSerializer(
            data={"refresh": request_serializer.validated_data["refreshToken"]}
        )
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as error:
            raise InvalidToken(str(error)) from error
        data = serializer.validated_data
        submitted_refresh_token = request_serializer.validated_data["refreshToken"]
        return Response(
            {
                "accessToken": data["access"],
                "refreshToken": data.get("refresh", submitted_refresh_token),
            }
        )


class LogoutView(GenericAPIView):
    serializer_class = RefreshTokenSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refreshToken"]).blacklist()
        except TokenError:
            # Expired, malformed or already-blacklisted tokens cannot be reused anyway,
            # so logout reports success instead of failing a repeated sign-out.
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(GenericAPIView):
    serializer_class = SessionUserSerializer

    def get(self, request):
        return Response(self.get_serializer(request.user).data)


class AthleteViewSet(ModelViewSet):
    serializer_class = AthleteSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return athletes(self.request.query_params)

    def get_permissions(self):
        return [AllowAny()] if self.action in ["list", "retrieve"] else [IsSelfOrAdmin()]


class CityViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = CitySerializer

    def get_queryset(self):
        return cities_with_rating()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["positions"] = {city.id: index for index, city in enumerate(self.get_queryset(), 1)}
        return context
