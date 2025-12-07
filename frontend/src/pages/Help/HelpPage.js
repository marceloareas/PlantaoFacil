import "./HelpPage.css";

export default function Help() {
  return (
    <div className="help-container">
      <h1>Guia de Navegação do Sistema</h1>

      <section>
        <h2>Página inicial do sistema</h2>
        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image.png?raw=true"
          alt="Página inicial"
          className="help-img"
        />
      </section>

      <hr />

      <section>
        <h2>Método de acesso</h2>

        <h3>Gestor</h3>
        <p>
          O cadastro do gestor é realizado pelo administrador do sistema.  
          As credenciais serão entregues diretamente ao gestor, que deverá utilizá-las na aba <strong>“Login”</strong>, localizada no topo da página.
        </p>

        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(1).png?raw=true"
          alt="Login Gestor"
          className="help-img"
        />

        <h3>Colaborador (Técnico/Enfermeiro)</h3>
        <p>
          As credenciais de acesso e informações pessoais (como CPF, Coren etc.) são cadastradas pelo gestor.
        </p>
      </section>

      <hr />

      <section>
        <h2>Cadastro de usuários</h2>
        <p>
          Somente o gestor possui acesso à tela de cadastro.  
          Após estar logado, basta clicar na aba <strong>“SignUp”</strong> no topo da página.
        </p>

        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(2).png?raw=true"
          alt="Tela de cadastro"
          className="help-img"
        />

        <p>
          Depois disso, preencha os dados do novo colaborador e clique em <strong>Sign Up</strong> para salvar.
        </p>

        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(3).png?raw=true"
          alt="Formulário de cadastro"
          className="help-img"
        />
      </section>

      <hr />

      <section>
        <h2>Escalas</h2>

        <h3>Para o Gestor</h3>
        <p>
          O gestor pode visualizar:
        </p>

        <ul>
          <li>A escala semanal (na tela inicial - <strong>home</strong>)</li>
          <li>A escala diária (menu → <strong>calendário</strong>)</li>
        </ul>

        <p>
          No calendário, basta selecionar um dia.  
          Caso seja necessário montar ou alterar uma escala, clique em <strong>“Enviar Escala”</strong>.
        </p>

        <img src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(4).png?raw=true" className="help-img" alt="Escala semanal" />
        <img src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(5).png?raw=true" className="help-img" alt="Escala semanal" />
        <img src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(6).png?raw=true" className="help-img" alt="Escala semanal" />
        <img src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(7).png?raw=true" className="help-img" alt="Escala diária" />

        <h3>Para o Colaborador</h3>
        <p>
          O colaborador tem acesso apenas à visualização da escala semanal.
        </p>

        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(8).png?raw=true"
          alt="Escala semanal colaborador"
          className="help-img"
        />
      </section>

      <hr />

      <section>
        <h2>Funcionários Ausentes</h2>
        <p>
          O gestor pode verificar funcionários ausentes em qualquer data.  
          Para registrar uma ausência, acesse:
        </p>

        <p><strong>menu → Funcionários Ausentes → “Adicionar ausência”</strong></p>

        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(9).png?raw=true"
          alt="Adicionar ausência"
          className="help-img"
        />
        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(10).png?raw=true"
          alt="Adicionar ausência"
          className="help-img"
        />

        <p>
          Após salvar, a ausência aparecerá no calendário e na lista da própria tela.  
          É possível remover uma ausência clicando em <strong>“remover”</strong>.
        </p>

        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(11).png?raw=true"
          alt="Remover ausência"
          className="help-img"
        />
        <img 
          src="https://github.com/andressa-oliveira21051/Fotos/blob/main/image%20(12).png?raw=true"
          alt="Remover ausência"
          className="help-img"
        />
      </section>

      <br />
    </div>
  );
}

