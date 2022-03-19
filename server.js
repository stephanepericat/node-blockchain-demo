// "use strict";
// var express = require("express");
// var app = express();
// const Blockchain = require("./blockchain");

// function uuidv4() {
//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
//     var r = (Math.random() * 16) | 0,
//       v = c == "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }

// app.use(express.json());

// let node_id = uuidv4();
// app.get("/", function (req, res) {
//   res.send(JSON.stringify(Blockchain.chain));
// });
// app.get("/chain", function (req, res) {
//   res.send(JSON.stringify(Blockchain.chain));
// });

// app.get("/mine", function (req, res) {
//   var last_proof;
//   let last_block = Blockchain.last_block();
//   if (last_block == 0) {
//     last_proof = 0;
//   } else {
//     last_proof = last_block.proof;
//   }
//   var proof = Blockchain.proof_of_work(last_proof);

//   /*
//         Add a bitcoin for the miner
//         0 in sender means it is being mined (no sender, sender is the blockchain)
//         recipient is node ID
//     */
//   var index = Blockchain.new_transaction(0, node_id, 1);

//   let previous_hash = Blockchain.hash(last_block);
//   let block = Blockchain.new_block(proof, previous_hash);

//   res.send(JSON.stringify(block));
// });

// app.post("/transactions/new", function (req, res) {
//   if (
//     req.query.sender === "" ||
//     req.query.ammount === "" ||
//     req.query.recipient === ""
//   ) {
//     res.send("Missing values");
//     return;
//   }
//   let index = Blockchain.new_transaction(
//     req.query.sender,
//     req.query.recipient,
//     req.query.ammount
//   );
//   res.send("Transaction will be added to block " + index);
// });

// app.post("/nodes/register", function (req, res) {
//   var nodes = req.body.nodes;
//   if (nodes === "") {
//     res.send("Provide a list of nodes or leave me alone");
//   }
//   nodes.forEach((element) => {
//     Blockchain.register_node(element);
//   });
//   res.send("Nodes will be added to the block ");
// });

// app.get("/nodes/resolve", function (req, res) {
//   var replaced = Blockchain.resolve_conflicts();
//   res.send(JSON.stringify(Blockchain));
// });

// var myArgs = process.argv.slice(2)[0];
// console.log("Launching bitnode in port: ", myArgs);

// var server = app.listen(myArgs, function () {});

// import consola from "consola";
import express from "express";
import * as uuid from "uuid";
import { Blockchain } from "./blockchain.js";

const bc = new Blockchain();
const app = express();
const nodeId = uuid.v4();

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

app.get("/nodes/register", (_, res) => res.json("register"));
app.get("/nodes/resolve", (_, res) => res.json("resolve"));

app.listen(3000);
