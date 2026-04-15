import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "seu-segredo-super-secreto-aqui";

export function gerarToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (erro) {
    return null;
  }
}

export function middlewareAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  const decoded = verificarToken(token);
  if (!decoded) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }

  req.userId = decoded.userId;
  next();
}

export default middlewareAuth;
