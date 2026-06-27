const MotivoModal = ({ show, onClose, motivo, nome }) => {
    if (!show) return null;

    return (
        <>
            <div className="modal show fade d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title">
                                Motivo Indisponibilidade — {nome}
                            </h5>
                            <button className="btn-close" onClick={onClose} />
                        </div>

                        <div className="modal-body" style={ {maxHeight: "400px",overflowY: "auto", wordBreak: "break-word"}}>
                            {motivo ? (
                                <p>{motivo}</p>
                            ) : (
                                <p className="text-muted">Nenhum motivo informado.</p>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}>
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

export default MotivoModal;