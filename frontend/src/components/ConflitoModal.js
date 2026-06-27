const ConflitoModal = ({
    show,
    onClose,
    conflitos,
    funcSelecionado
}) => {
    if (!show) return null;

    return (
        <>
            <div className="modal show fade d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title">
                                ⚠️ Conflitos de Escala — {funcSelecionado?.nome}
                            </h5>
                            <button
                                className="btn-close"
                                onClick={onClose}
                            />
                        </div>

                        <div className="modal-body">
                            {conflitos.length === 0 ? (
                                <div className="alert alert-success">
                                    Nenhum conflito encontrado 🎉
                                </div>
                            ) : (
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Turno</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conflitos.map((c, i) => (
                                            <tr key={i}>
                                                <td>{c.data}</td>
                                                <td>{c.horario}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Fechar
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default ConflitoModal;