export const CARGO_ADMIN = "Admin";
export const CARGO_COORDENADOR = "Coordenador";

const normalizar = (cargo) => (cargo || "").trim().toLowerCase();

export const isCargoGestao = (cargo) =>
    [CARGO_ADMIN, CARGO_COORDENADOR].some((c) => c.toLowerCase() === normalizar(cargo));

export const isAdmin = (user) => normalizar(user?.cargo) === CARGO_ADMIN.toLowerCase();

// coordenadores e admins escolhem o setor ao entrar e gerenciam a escala
export const isGestor = (user) => isCargoGestao(user?.cargo);
