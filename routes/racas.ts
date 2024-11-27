import { PrismaClient } from "@prisma/client";
import { Router } from "express";

// const prisma = new PrismaClient()
const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
});

const router = Router();

router.get("/", async (req, res) => {
  try {
    const racas = await prisma.raca.findMany();
    res.status(200).json(racas);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/", async (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    res.status(400).json({ erro: "Informe nome da raca" });
    return;
  }

  try {
    const raca = await prisma.raca.create({
      data: { nome },
    });
    res.status(201).json(raca);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const raca = await prisma.raca.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(raca);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;

  if (!nome) {
    res.status(400).json({ erro: "Informe nome da raca" });
    return;
  }

  try {
    const raca = await prisma.raca.update({
      where: { id: Number(id) },
      data: { nome },
    });
    res.status(200).json(raca);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;