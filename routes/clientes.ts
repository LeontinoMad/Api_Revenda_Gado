import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.status(200).json(clientes);
  } catch (error) {
    res.status(400).json(error);
  }
});

function validaSenha(senha: string) {
  const mensa: string[] = [];

  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres");
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
      "Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos"
    );
  }

  return mensa;
}

router.post("/", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    res.status(400).json({ erro: "Informe nome, email e senha" });
    return;
  }

  const erros = validaSenha(senha);
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") });
    return;
  }

  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(senha, salt);

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, senha: hash },
    });
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const mensaPadrao = "Login ou senha incorretos";

  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao });
    return;
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { email },
    });

    if (cliente == null) {
      res.status(400).json({ erro: mensaPadrao });
      return;
    }

    if (bcrypt.compareSync(senha, cliente.senha)) {
      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
      });
    } else {
      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/redefinir-senha/:email", async (req, res) => {
  const { email } = req.params;
  const { senha } = req.body;

  if (!senha) {
    res.status(400).json({ erro: "Informe a nova senha" });
    return;
  }

  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(senha, salt);

  try {
    
    const cliente = await prisma.cliente.update({
      where: { email: email},
      data: {senha: hash}
    });
    res.status(201).json(cliente);
    console.log("Funcionou");
  } catch (error) {
    res.status(400).json(error);
    console.log("Não funcionou, otário");
  }
});


router.post("/verifica-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ erro: "E-mail não cadastrado, tente outro>" });
    return;
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { email },
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

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (cliente == null) {
      res.status(400).json({ erro: "não cadastrado" });
    } else {
      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
      });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
