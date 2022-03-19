import axios from "axios";
import crypto from "crypto";

export class Block {
  constructor(index, timestamp, transactions, proof, previous_hash) {
    this._index = index;
    this._timestamp = timestamp;
    this._transactions = transactions;
    this._proof = proof;
    this._previous_hash = previous_hash;
  }

  get timestamp() {
    return this._timestamp;
  }

  get transactions() {
    return this._transactions;
  }

  get proof() {
    return this._proof;
  }

  get previous_hash() {
    return this._previous_hash;
  }

  get index() {
    return this._index;
  }
}

export class Blockchain {
  constructor() {
    this._chain = [];
    this._nodes = new Set();
    this._currentTransactions = [];
    //Add genesis block
    this.createBlock(100, 1);
  }

  get chain() {
    return this._chain;
  }

  get nodes() {
    return this._nodes;
  }

  get currentTransactions() {
    return this._currentTransactions;
  }

  set currentTransactions(transactions) {
    this._currentTransactions = transactions;
  }

  createBlock(proof, previousHash = null) {
    const timestamp = new Date();
    const previousIndex = this.chain.length == 0 ? 0 : this.chain.length - 1;
    const index = this.chain.length + 1;
    const transactions = this.currentTransactions;
    const hash = previousHash || this.create(this.chain[previousIndex]);

    const block = new Block(index, timestamp, transactions, proof, hash);

    this.currentTransactions = [];
    this.chain.push(block);

    return block;
  }

  getLastBlock() {
    return this.chain.length ? this.chain[this.chain.length - 1] : 0;
  }

  createHash(block) {
    const blockString = JSON.stringify(block);
    const b64String = Buffer.from(blockString).toString("base64");

    return crypto.createHash("sha256").update(b64String).digest("base64");
  }

  createTransaction(sender, recipient, amount) {
    this.currentTransactions.push({ sender, recipient, amount });

    return this.chain.length ? this.chain[this.chain.length - 1].index + 1 : 1;
  }

  mine(lastProof) {
    let proof = 0;

    return new Promise((resolve) => {
      while (!this.validateProof(lastProof, proof)) {
        proof += 1;
      }

      resolve(proof);
    });
  }

  validateProof(lastProof, proof) {
    const guess = `${Buffer.from(proof.toString()).toString(
      "base64"
    )}${Buffer.from(lastProof.toString()).toString("base64")}`;
    const hash = crypto.createHash("sha256").update(guess).digest("base64");

    return hash.startsWith("0000");
  }

  registerNode(address) {
    try {
      const parsedUrl = new URL(address);
      this._nodes.add(parsedUrl);
    } catch (e) {
      throw new Error(e);
    }
  }

  validateChain(chain) {
    let currentIndex = 1;
    let lastBlock = chain[0];

    while(currentIndex < chain.length) {
      const block = chain[currentIndex];

      if(block.previousHash !== this.createHash(block)) {
        return false;
      }

      if(!this.validateProof(lastBlock.proof, block.proof)) {
        return false;
      }

      lastBlock = block;
      currentIndex += 1;
    }

    return true;
  }

  resolveConflicts () {
    let maxLength = this.chain.length;

    // TODO: FIX !!!
    this.nodes.forEach(async (node) => {
      try {
        const { data: newChain } = await axios.get(`${node.origin}/chain`);

        if(this.validateChain(newChain) && newChain.length > maxLength) {
          this._chain = newChain;
          maxLength = newChain.length;
        }
      } catch(e) {
        throw new Error(e);
      }
    });
  }
}
