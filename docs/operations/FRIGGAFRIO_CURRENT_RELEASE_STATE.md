# FriggaFrio Current Release State

- Production SHA: `ad7b34b921fc63b75e94579d5121b89448296f85`.
- Latest versioned candidate SHA: `26c019e0a812f8c2c07eef493799c5464079246f`.
- Candidate status: runtime validated internally; not published after external public Admin ingress returned 404.
- WSL source mirror: synchronized to the latest candidate SHA before the failed public validation.
- Production database: no migration or restore was performed during the failed attempt.
- Preserved failed candidate: `/home/srv/friggafrio/Maestro-deploy-failed-20260824T135300Z`.
- Public status at record time: `/health` 200, `/br` 200, `/app` 404.
- Resume gate: external ingress route validation and graceful reload on `177.70.8.202`, then a new immutable candidate deploy.
- External configuration: Resend API and webhook values remain pending; this does not block independent site functionality.
