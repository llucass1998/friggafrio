# Revisão de Privacidade de Publicação da Equipe

- [x] O script de extração ignorou intencionalmente a raspagem e inclusão de emails (ex: `*@friggafrio.com.br`) na configuração de membros da equipe.
- [x] O script de extração ignorou a raspagem de telefones/ramais (ex: `3224-1670`, celulares) associados aos membros.
- [x] O payload frontend gerado (`company-team.ts`) contém apenas: Nome, Cargo, Bio (quando aplicável), Foto, e Grupos. Nenhuma PII sensível foi exposta.
- [x] Nenhum script de rastreamento do site original foi importado.
- [x] Todas as imagens hospedadas são cópias locais higienizadas e otimizadas sem metadados sensíveis na conversão para `.webp`.
