import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";

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

function validaTelefone(telefone: string): string[] {
  const mensa: string[] = [];
  // Remove tudo que não for dígito.
  // Se o usuário, por engano, colocar o '+', o '55' ou parênteses, etc., eles serão removidos aqui.
  const telefoneLimpo = telefone.replace(/\D/g, "");

  // Espera que o telefoneLimpo tenha 10 ou 11 dígitos (DDD + número)
  // Ex: 11987654321 (11 dígitos para celular) ou 1123456789 (10 dígitos para fixo)
  if (telefoneLimpo.length !== 10 && telefoneLimpo.length !== 11) {
    mensa.push("Erro... o telefone deve ter 10 ou 11 dígitos (DDD + número).");
  }

  // Verifica se todos os caracteres são números após a limpeza
  if (!/^\d+$/.test(telefoneLimpo)) {
    mensa.push("Erro... o telefone deve conter apenas números.");
  }

  return mensa;
}

// --- Rotas da API ---

// Rota para listar todos os clientes
router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        cpf: true,
        telefone: true,
        // Não expomos a senha aqui por segurança
      },
    });
    res.status(200).json(clientes);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para cadastrar um novo cliente
router.post("/", async (req, res) => {
  const { nome, cpf, telefone, senha } = req.body;

  if (!nome || !cpf || !telefone || !senha) {
    res
      .status(400)
      .json({ erro: "Por favor, informe nome, CPF, telefone e senha." });
    return;
  }

  // Valida o telefone (DDD + Número)
  const errosTelefone = validaTelefone(telefone);
  if (errosTelefone.length > 0) {
    res.status(400).json({ erro: errosTelefone.join("; ") });
    return;
  }

  // Valida a senha
  const errosSenha = validaSenha(senha);
  if (errosSenha.length > 0) {
    res.status(400).json({ erro: errosSenha.join("; ") });
    return;
  }

  // --- Normaliza e formata o telefone para o padrão internacional (+55DDNNNNNNNNN) ---
  const telefoneLimpo = telefone.replace(/\D/g, ""); // Remove caracteres não-numéricos
  const telefoneParaSalvar = `+55${telefoneLimpo}`; // Adiciona o DDI do Brasil (+55)
  // ---------------------------------------------------------------------------------

  // Gera o hash da senha
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(senha, salt);

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, cpf, telefone: telefoneParaSalvar, senha: hash },
    });
    res.status(201).json(cliente);
  } catch (error: any) {
    // Trata o erro de CPF duplicado (código P2002 do Prisma)
    if (error.code === "P2002" && error.meta?.target.includes("cpf")) {
      res.status(409).json({ erro: "CPF já cadastrado." }); // 409 Conflict
    } else {
      res.status(400).json(error);
    }
  }
});

// Rota para login de cliente (CPF e Senha)
router.post("/login", async (req, res) => {
  const { cpf, senha } = req.body;

  const mensaPadrao = "CPF ou senha incorretos.";

  if (!cpf || !senha) {
    res.status(400).json({ erro: mensaPadrao });
    return;
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { cpf }, // Busca o cliente pelo CPF
    });

    if (cliente == null) {
      res.status(400).json({ erro: mensaPadrao });
      return;
    }

    // Compara a senha informada com o hash salvo no banco
    if (bcrypt.compareSync(senha, cliente.senha)) {
      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone, // Inclui o telefone no retorno do login
      });
    } else {
      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para redefinir a senha de um cliente (pelo CPF)
router.put("/redefinir-senha/:cpf", async (req, res) => {
  const { cpf } = req.params;
  const { senha } = req.body;

  if (!senha) {
    res.status(400).json({ erro: "Por favor, informe a nova senha." });
    return;
  }

  // Valida a nova senha
  const errosSenha = validaSenha(senha);
  if (errosSenha.length > 0) {
    res.status(400).json({ erro: errosSenha.join("; ") });
    return;
  }

  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(senha, salt);

  try {
    const cliente = await prisma.cliente.update({
      where: { cpf: cpf }, // Encontra o cliente pelo CPF
      data: { senha: hash },
    });
    res.status(200).json(cliente);
    console.log("Senha redefinida com sucesso para o CPF:", cpf);
  } catch (error) {
    res.status(400).json(error);
    console.log("Não foi possível redefinir a senha para o CPF:", cpf, error);
  }
});

// Rota para verificar se um CPF já está cadastrado
router.post("/verifica-cpf", async (req, res) => {
  const { cpf } = req.body;

  if (!cpf) {
    res.status(400).json({ erro: "CPF não informado." });
    return;
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { cpf },
    });

    if (cliente) {
      res.status(200).json({ existe: true });
    } else {
      res.status(404).json({ existe: false });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para buscar um cliente por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        cpf: true,
        telefone: true,
      },
    });

    if (cliente == null) {
      res.status(404).json({ erro: "Cliente não encontrado." }); // 404 Not Found é mais apropriado aqui
    } else {
      res.status(200).json(cliente);
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
