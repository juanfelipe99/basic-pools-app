import hashlib
import hmac
import secrets

from app.core.config import settings


def generate_admin_token() -> str:
    return secrets.token_urlsafe(32)


def hash_admin_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def verify_admin_token(token: str, token_hash: str) -> bool:
    return hmac.compare_digest(hash_admin_token(token), token_hash)


def hash_ip(ip: str) -> str:
    # Keyed hash: a plain SHA-256 of an IPv4 address can be reversed by brute force
    return hmac.new(
        settings.IP_HASH_SECRET.encode(), ip.encode(), hashlib.sha256
    ).hexdigest()
