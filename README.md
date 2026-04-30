# 🌿 Plantão Fácil

O **Plantão Fácil** é um aplicativo voltado para a **gestão de horários e plantões de enfermeiros e técnicos de enfermagem**.  
Ele facilita a organização de escalas, trocas, horas extras e controle de férias, garantindo transparência e praticidade tanto para os profissionais quanto para os gestores.

---

## 🚑 Funcionalidades Principais

- **Escalas de plantão**
  - Configuração inicial de turnos (12x60 ou 12x36).
  - Plantões **diurnos** e **noturnos**.

- **Trocas e horas extras**
  - Possibilidade de **trocas de plantões** (somente entre a mesma categoria: enfermeiro ↔ enfermeiro / técnico ↔ técnico).
  - Cada profissional pode realizar até **5 trocas** e **5 plantões extras** no período.
  - Restrição: **não é permitido ultrapassar 24h consecutivas de trabalho**.

- **Controle de faltas**
  - Apenas o **gestor** pode marcar faltas.

- **Fluxo de solicitações**
  1. Profissional visualiza a escala.  
  2. Solicita troca ou extra.  
  3. Outro profissional aceita.  
  4. Gestor aprova (só é válido após aprovação).  

- **Banco de horas e folgas**
  - Possibilidade futura de incluir folga vinculada ao banco de horas.  

- **Doenças e ausências**
  - Sistema emite **alerta** quando há menos profissionais do que o mínimo necessário.  
  - Plantões extras **não contam** para esse controle.

- **Férias**
  - Controle de férias (tiradas ou vendidas).
  - Usuários podem ser **ativados ou desativados** devido às férias.

---

## 👥 Perfis de Acesso

- **Gestor**
  - Cadastra todos os profissionais.  
  - Aprova trocas e horas extras.  
  - Marca faltas.  

- **Usuário (profissional)**
  - Ativa seu próprio acesso após cadastro.  
  - Visualiza escala, solicita trocas e horas extras.  

---

## 🛠️ Tecnologias e Arquitetura

O projeto será desenvolvido em uma arquitetura baseada em **Docker**, com containers separados para:

- **Banco de Dados (PostGreSQL)**  
- **Back-end (Python)**  
- **Front-end (React-Js)**  

---
