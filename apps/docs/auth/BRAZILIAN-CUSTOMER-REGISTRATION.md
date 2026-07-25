# Configuração da Experiência B2B e B2C no Brasil (LGPD)

## Visão Geral
A arquitetura de registro da **FriggaFrio** utiliza o SDK JS Oficial (V2) do **MedusaJS**, integrando um formulário de cadastro híbrido (Pessoa Física e Pessoa Jurídica) adaptado para o mercado brasileiro.

### B2C (Pessoa Física)
- **Registro de Contas**: Os clientes B2C efetuam cadastro usando um formulário onde Nome, Sobrenome, E-mail, Telefone, e **CPF** são requeridos.
- **Formatação e Máscara**: O CPF é mascarado via utilitário, e, no instante do envio, a pontuação é removida, preservando apenas o valor numérico dentro do campo de `metadata` a ser submetido ao Medusa.
- **Aceite LGPD**: Obrigatório por lei.

### B2B (Pessoa Jurídica)
- **Registro de Contas**: O fluxo se divide nas requisições, onde em vez do `customer`, uma lógica separada atua chamando `registerCompany()` no módulo da Medusa, criando uma estrutura organizacional. Requer **Razão Social** e **CNPJ**.
- **Formatação e Máscara**: O CNPJ possui as devidas validações (14 dígitos), armazenado no `metadata` ou em módulo `company` estendido.

## Segurança e Tratamento de Dados

A prioridade crítica do projeto é proteger a manipulação e envio do documento de identificação fiscal (CPF/CNPJ).
- **Sem logs ou armazenamento persistente em front-end**: Estes documentos **nunca** transitam em variáveis mantidas no localStorage após recarregamento.
- **Não salvamento temporário**: Por não armazenar nenhum estado de andamento no storage (sem rascunhos de senhas), não há risco de sessões ativas persistirem os documentos e a senha crua.
- **Limpeza no Submit**: As máscaras de formatação são aplicadas com React Hook Form. A API de submissão do Medusa só enxerga a requisição via `https` e com o body sanitizado.

## Próximos Passos (Backend Check)
1. Certificar-se que a API da Medusa (`POST /auth/register` ou similar) está configurada no backend para aceitar campos no objeto `metadata`, ou mapear os dados corretamente.
2. Certificar-se que a comunicação local aponta sempre para portas 9000 e 5174 com a varável `VITE_MEDUSA_BACKEND_URL` sem depender de fallbacks ocultos de prod.