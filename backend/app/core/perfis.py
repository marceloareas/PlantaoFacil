CARGO_ADMIN = "Admin"
CARGO_COORDENADOR = "Coordenador"

_CARGOS_GESTAO = {CARGO_ADMIN.lower(), CARGO_COORDENADOR.lower()}


def _normalizar(cargo: str | None) -> str:
    return (cargo or "").strip().lower()


def is_cargo_gestao(cargo: str | None) -> bool:
    return _normalizar(cargo) in _CARGOS_GESTAO


def is_admin(user) -> bool:
    return _normalizar(user.cargo) == CARGO_ADMIN.lower()


def is_gestor(user) -> bool:
    """Coordenadores e admins: não pertencem a um setor e gerenciam a escala."""
    return is_cargo_gestao(user.cargo)
