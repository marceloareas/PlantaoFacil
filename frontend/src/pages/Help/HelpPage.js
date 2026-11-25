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
        <h2>Perfis de gestão: Admin e Coordenador</h2>
        <p>
          Existem dois perfis de gestor: <strong>Admin</strong> e <strong>Coordenador</strong>. Os dois escolhem
          o setor ao entrar e podem montar escalas, aprovar trocas, cadastrar funcionários e gerenciar períodos,
          limites e faltas.
        </p>
        <ul>
          <li>O <strong>Coordenador</strong> cadastra e edita enfermeiros e técnicos.</li>
          <li>
            O <strong>Admin</strong> faz tudo o que o coordenador faz e, além disso, é o único que cadastra e
            edita coordenadores e outros admins.
          </li>
          <li>Ninguém pode alterar o próprio cargo.</li>
        </ul>
      </section>

      <hr />

      <section>
        <h2>Setores</h2>
        <p>
          Cada colaborador pertence a um setor (ex.: UTI, Emergência), e cada setor tem sua própria escala,
          trocas e indisponibilidades. O colaborador vê sempre a escala do seu setor.
        </p>
        <p>
          Ao entrar no sistema, o gestor escolhe qual setor está coordenando naquele momento. O setor atual
          aparece no topo da página; clique nele para trocar de setor. Para criar, renomear ou excluir setores,
          use a opção <strong>“Setores”</strong> no menu. Para transferir um colaborador, edite-o na tela
          <strong> “Funcionários”</strong>.
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
        <h2>Períodos e escala do período</h2>
        <p>
          A escala de cada setor é organizada em períodos. Acesse <strong>menu → Períodos</strong> (ou o botão
          <strong> “Períodos e escala”</strong> na tela inicial), clique em <strong>“Novo período”</strong> e
          informe só a data de início. O período termina sempre no dia anterior ao mesmo dia do mês seguinte
          (ex.: de 15/10 a 14/11). Os períodos de um mesmo setor não podem se sobrepor.
        </p>
        <p>
          Depois de criar o período, clique em <strong>“Gerar escala”</strong>. O sistema escala todos os
          funcionários ativos do setor nos seus dias de trabalho, de acordo com o cadastro de cada um
          (tela <strong>“Funcionários”</strong>):
        </p>
        <ul>
          <li><strong>Turno</strong>: diurno (07:00 - 19:00) ou noturno (19:00 - 07:00);</li>
          <li><strong>Início do ciclo</strong>: o primeiro dia trabalhado, a partir do qual os plantões se repetem;</li>
          <li><strong>Regime</strong>: 12x36 (um plantão a cada 2 dias) ou 12x60 (um plantão a cada 3 dias).</li>
        </ul>
        <p>
          Funcionários sem turno ou sem início do ciclo aparecem no resumo da geração e não são escalados.
          Preencha esses campos e clique em <strong>“Completar escala”</strong>: gerar de novo só inclui quem
          ainda não tem plantões no período, sem mexer na escala dos demais. Dias com indisponibilidade, escala em outro setor no mesmo turno ou que
          formariam 3 turnos seguidos ficam de fora e também aparecem no resumo. Depois que a escala é gerada,
          o período não pode mais ser excluído.
        </p>
      </section>

      <hr />

      <section>
        <h2>Limites e avisos</h2>
        <p>
          Cada setor tem dois limites por funcionário em cada período: o número de <strong>plantões extras</strong>
          {" "}e o número de <strong>trocas solicitadas</strong> (o padrão é 5 de cada). Os gestores alteram esses
          valores na tela <strong>“Períodos”</strong>, em “Limites do setor”.
        </p>
        <ul>
          <li>Plantão extra é qualquer plantão incluído na escala depois que a escala do período foi gerada.</li>
          <li>Plantões recebidos por troca não contam como extra, e trocas recusadas não contam no limite.</li>
        </ul>
        <p>
          Quando um funcionário passa do limite, o sistema avisa os gestores: um ícone de alerta com a quantidade
          de avisos aparece no topo da página e a tela inicial mostra um aviso. Na tela <strong>“Períodos”</strong>,
          a seção “Uso do período” mostra os extras e as trocas de cada funcionário. O aviso não impede a
          inclusão do plantão nem a troca.
        </p>
      </section>

      <hr />

      <section>
        <h2>Faltas</h2>
        <p>
          Na escala, o gestor clica no nome do funcionário e registra que ele faltou naquele turno, com uma
          observação opcional. O sistema guarda o dia e o turno da falta. Não é possível registrar falta em uma
          data futura.
        </p>
        <p>
          As faltas de cada período aparecem na tela <strong>“Períodos”</strong>, em “Faltas do período”, onde
          também podem ser removidas caso tenham sido registradas por engano.
        </p>
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

