import cors from "cors";
import express from "express";
import * as uuid from "uuid";
import { Blockchain } from "./blockchain.js";

const bc = new Blockchain();
const app = express();
const nodeId = uuid.v4();
const port = process.argv.slice(2)[0];

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.json(bc.chain));
app.get("/chain", (_, res) => res.json(bc.chain));

app.get("/mine", async (_, res) => {
  const lastBlock = bc.getLastBlock();
  const lastProof = lastBlock === 0 ? 0 : lastBlock.proof;
  const proof = await bc.mine(lastProof);

  bc.createTransaction(0, nodeId, 1);

  const previousHash = bc.createHash(lastBlock);
  const block = bc.createBlock(proof, previousHash);

  res.json(block);
});

app.post("/transactions/new", (req, res) => {
  const { sender = null, recipient = null, amount = null } = req.body;

  if (!sender || !recipient || !amount) {
    return res.status(400).json({
      error: true,
      errorText: "Missing arguments.",
      statusCode: 400,
      body: { sender, recipient, amount },
    });
  }

  const index = bc.createTransaction(sender, recipient, amount);

  res.status(200).json({ error: false, statusCode: 200, index });
});

app.post("/nodes/register", (req, res) => {
  const { nodes = [] } = req.body;

  if(!nodes.length) {
    return res.status(400).json({ error: true, errorText: "No nodes specified", statusCode: 400 });
  }

  nodes.forEach((node) => (bc.registerNode(node)));

  res.status(200).json({ nodes });
});

app.get("/nodes/resolve", async (_, res) => {
  const resolved = await bc.resolveConflicts();
  console.log("RESOLVED", resolved);
  res.status(200).json(bc);
});

app.listen(port, () => console.log(`Blockchain started at http://localhost:${port}/`));
