import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const router = Router();

// --- Funções de Validação ---

function validaSenha(senha: string): string[] {
  const mensa: string[] = [];

  if (senha.length < 8) {
    mensa.push("Erro... a senha deve ter, no mínimo, 8 caracteres.");
  }

  let pequenas = 0;
  let grandes = 0;
  let numeros = 0;
  let simbolos = 0;

  for (const letra of senha) {
    if (/[a-z]/.test(letra)) {
      pequenas++;
    } else if (/[A-Z]/.test(letra)) {
      grandes++;
    } else if (/[0-9]/.test(letra)) {
      numeros++;
    } else {
      simbolos++;
    }
  }

  if (pequenas === 0 || grandes === 0 || numeros === 0 || simbolos === 0) {
    mensa.push(
      "Erro... a senha deve conter letras minúsculas, maiúsculas, números e símbolos."
    );
  }

  return mensa;
}

// Função para validar o telefone (WhatsApp)
function validaTelefone(telefone: string): string[] {
  const mensa: string[] = [];
  // Remove tudo que não for dígito.
  const telefoneLimpo = telefone.replace(/\D/g, "");

  // Espera que o telefoneLimpo tenha 10 ou 11 dígitos (DDD + número)
  // Ex: 11987654321 (11 dígitos para celular) ou 1123456789 (10 dígitos para fixo)
  if (telefoneLimpo.length !== 10 && telefoneLimpo.length !== 11) {
    mensa.push(
      "Erro... o telefone (WhatsApp) deve ter 10 ou 11 dígitos (DDD + número)."
    );
  }

  // Verifica se todos os caracteres são números após a limpeza
  if (!/^\d+$/.test(telefoneLimpo)) {
    mensa.push("Erro... o telefone (WhatsApp) deve conter apenas números.");
  }

  return mensa;
}

// --- Rotas da API ---

// Rota para listar todos os administradores
router.get("/", async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        whats: true, // Inclui o campo 'whats' no retorno
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json(admins);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para cadastrar um novo administrador
router.post("/", async (req, res) => {
  // Desestrutura 'whats' do corpo da requisição
  const { nome, email, whats, senha } = req.body;

  // Validação de campos obrigatórios (agora incluindo 'whats' se ele for obrigatório no seu schema.prisma)
  if (!nome || !email || !whats || !senha) {
    res
      .status(400)
      .json({ erro: "Por favor, informe nome, email, WhatsApp e senha." });
    return;
  }

  // Validação da senha
  const errosSenha = validaSenha(senha);
  if (errosSenha.length > 0) {
    res.status(400).json({ erro: errosSenha.join("; ") });
    return;
  }

  // Validação do WhatsApp
  const errosWhats = validaTelefone(whats);
  if (errosWhats.length > 0) {
    res.status(400).json({ erro: errosWhats.join("; ") });
    return;
  }

  // Formata o WhatsApp para o padrão internacional (+55DDNNNNNNNNN) antes de salvar
  const whatsParaSalvar = `+55${whats.replace(/\D/g, "")}`;

  // Gera o hash da senha
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(senha, salt);

  try {
    const admin = await prisma.admin.create({
      // Passa todos os campos para o Prisma, incluindo 'whats' formatado
      data: { nome, email, whats: whatsParaSalvar, senha: hash },
    });
    res.status(201).json(admin);
  } catch (error: any) {
    // Trata erro de email duplicado (código P2002 do Prisma)
    if (error.code === "P2002" && error.meta?.target.includes("email")) {
      res
        .status(409)
        .json({ erro: "E-mail já cadastrado para outro administrador." }); // 409 Conflict
    } else {
      res.status(400).json(error);
    }
  }
});

// Rota para login de administrador (continua usando email e senha)
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const mensaPadrao = "Login ou senha incorretos";
  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao });
    return;
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email }, // Busca o administrador pelo email
    });

    if (admin == null) {
      res.status(400).json({ erro: mensaPadrao });
      return;
    }

    // Compara a senha informada com o hash salvo no banco
    if (bcrypt.compareSync(senha, admin.senha)) {
      // Gera o token JWT, incluindo dados do admin
      const token = jwt.sign(
        {
          admin_logado_id: admin.id,
          admin_logado_nome: admin.nome,
          admin_logado_email: admin.email,
          admin_logado_whats: admin.whats, // Inclui o WhatsApp no payload do token
        },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" } // Token expira em 1 hora
      );

      // Devolve id, nome, WhatsApp e o token gerado
      res
        .status(200)
        .json({ id: admin.id, nome: admin.nome, whats: admin.whats, token });
    } else {
      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
