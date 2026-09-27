from app.core.security import (
    generate_admin_token,
    hash_admin_token,
    hash_ip,
    verify_admin_token,
)


def test_admin_token_round_trip() -> None:
    token = generate_admin_token()
    token_hash = hash_admin_token(token)

    assert token_hash != token
    assert verify_admin_token(token, token_hash)
    assert not verify_admin_token("wrong", token_hash)


def test_admin_tokens_are_unique() -> None:
    assert generate_admin_token() != generate_admin_token()


def test_hash_ip_is_deterministic_and_distinct() -> None:
    assert hash_ip("203.0.113.1") == hash_ip("203.0.113.1")
    assert hash_ip("203.0.113.1") != hash_ip("203.0.113.2")
