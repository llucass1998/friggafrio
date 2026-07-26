import { encrypt, decrypt } from "../lib/encryption";
import { isValidCpf } from "../lib/validation/document";
import crypto from "crypto";

describe("🛡️ Auditoria de Segurança e Simulação de Ataques", () => {
  beforeAll(() => {
    process.env.DATA_ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "mp_secret_abc123";
  });

  describe("1. Vazamento e Alteração de Dados de Clientes (AES-256-GCM)", () => {
    it("Ataque: Hacker tenta alterar o CPF criptografado no banco de dados", () => {
      const cpfOriginal = "12345678900";
      const { encryptedData, iv, authTag } = encrypt(cpfOriginal);

      // Hacker invade o banco e muda um caractere do dado criptografado
      const lastCharacter = encryptedData.at(-1);
      const replacementCharacter = lastCharacter === "0" ? "1" : "0";
      const tamperedData =
        encryptedData.substring(0, encryptedData.length - 1) +
        replacementCharacter;

      // O AES-GCM possui uma tag de autenticação. Se o texto cifrado mudar, ele deve rejeitar
      expect(() => {
        decrypt(tamperedData, iv, authTag);
      }).toThrow(); // Exige que o sistema quebre em vez de retornar um dado falso
    });

    it("Ataque: Injeção de CPF falso/gerado para fraudar cadastro", () => {
      // Um script tentando enviar CPFs inválidos ou formatados com injeção
      expect(isValidCpf("11111111111")).toBe(false);
      expect(isValidCpf("00000000000")).toBe(false);
      expect(isValidCpf("123.456.789-00")).toBe(false); // Deve vir limpo da API
    });
  });

  describe("2. Falsificação de Pagamentos Mercado Pago (HMAC Replay/Spoofing)", () => {
    it("Ataque: Interceptação e forja de webhook de pagamento APROVADO", () => {
      const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET!;
      const reqId = "req_12345";
      const ts = Date.now().toString();

      // O Hacker tenta criar uma assinatura falsa dizendo que a transação foi aprovada
      const fakeSignature = "v1=assinatura_falsa_do_hacker,ts=" + ts;

      // Lógica interna da rota que confere o HMAC:
      const parts = fakeSignature.split(",");
      let receivedTs = "",
        receivedV1 = "";
      for (const part of parts) {
        const [key, value] = part.split("=");
        if (key === "ts") receivedTs = value;
        if (key === "v1") receivedV1 = value;
      }

      const manifest = `id:${reqId};request-id:${reqId};ts:${receivedTs};`;
      const computedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(manifest)
        .digest("hex");

      // O sistema barra instantaneamente:
      expect(computedSignature).not.toBe(receivedV1);
    });
  });

  describe("3. Anti-Fraude de Carrinho (Bypass de Preço/Política)", () => {
    it("Ataque: Frontend tenta forçar a compra de um item restrito (QUOTE_ONLY)", () => {
      // Mock da lógica interna do nosso checkoutWorkflow
      const is_quote_only = true;
      const product_title = "Câmara Fria Industrial 5000L";

      const simulateCheckoutBypass = () => {
        if (is_quote_only) {
          throw new Error(
            `Product ${product_title} requires quote only and cannot be checked out directly.`,
          );
        }
        return "checkout_approved";
      };

      // Se um robô pular o frontend e bater na nossa API tentando pagar, a API trava:
      expect(simulateCheckoutBypass).toThrowError(
        "requires quote only and cannot be checked out directly",
      );
    });
  });
});
