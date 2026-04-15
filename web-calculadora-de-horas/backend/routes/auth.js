import express from "express";
import { gerarToken, verificarToken } from "../middleware/auth.js";
import { criarUsuario } from "../models/user.js";

const authRouter = express.Router();

// Login - Retorna token JWT
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios" });
    }

    // Buscar usuário (implementar no models/user.js)
    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario) {
      return res.status(401).json({ erro: "Email ou senha incorretos" });
    }

    // Verificar senha (implementar com bcrypt no models/user.js)
    if (usuario.password !== password) {
      // TODO: Usar bcrypt.compare()
      return res.status(401).json({ erro: "Email ou senha incorretos" });
    }

    // Gerar token
    const token = gerarToken(usuario.id);

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        name: usuario.name,
      },
    });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Register - Criar novo usuário
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ erro: "Email, senha e nome são obrigatórios" });
    }

    // Verificar se email existe (implementar no models/user.js)
    const usuarioExistente = await buscarUsuarioPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ erro: "Email já registrado" });
    }

    // Criar usuário
    const novoUsuario = await criarUsuario({
      email,
      password, // TODO: Fazer hash com bcrypt
      name,
    });

    // Gerar token
    const token = gerarToken(novoUsuario.id);

    res.status(201).json({
      token,
      usuario: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        name: novoUsuario.name,
      },
    });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

// Verificar token
authRouter.post("/verify", (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valido: false });
    }

    const decoded = verificarToken(token);
    if (!decoded) {
      return res.status(400).json({ valido: false });
    }

    res.json({ valido: true, userId: decoded.userId });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

export default authRouter;
