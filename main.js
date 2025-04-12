// ### git config
// $ git config --global user.name "shk178"
// $ git config --global user.email "hknn55t@gmail.com"
// $ git config --global core.autocrlf true
// ### vsc to repos
// 클론
// git remote rename origin azure
// 작성
// $ git checkout -b chapter-2-dev
// 저장, $ git add ., $ git status
// $ git commit -m "chapter 2, pages 43-71"
// $ git push -u azure chapter-2-dev
// ### vcs to github
// $ git remote add github https://github.com/shk178/principle-implementation.git
// $ git pull github
// $ git checkout -b main github/main
// $ git checkout -b chapter-2
// 저장, $ git add ., $ git status
// $ git commit -m "Add chapter-2 code"
// $ git push -u github chapter-2
// $ git checkout main
// $ git merge main chapter-2
// $ git push github main
// ### 1.11 기본값으로 package.json 파일 생성
// $ npm init -y
// "index.js" (-->) "main.js"
// "test": ~ (+++) , "start": "node main.js"
// ### Chapter-1 (책 순서 #1)
"use strict";
const fs = require("fs");
const CryptoJS = require("crypto-js");
const merkle = require("merkle");
// 1.15 자바스크립트로 표현한 블록 구조 (책 순서 #2)
class BlockHeader {
    constructor(version, index, previousHash, timestamp, merkleRoot) {
        this.version = version;
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.merkleRoot = merkleRoot;
    }
}
class Block {
    constructor(header, data) {
        this.header = header;
        this.data = data;
    }
}
// ### 1.16 블록체인 저장 (책 순서 #4)
// blockchain: 본 구현체에서는 블록체인을 인-메모리 자바스크립트 배열에 저장한다.
// (...) 프로그램을 종료하면 모든 정보가 사라지므로 보존하려면 데이터베이스를 활용한다.
// var blockchain = []; (-->) 1.22 (#3): 함수 선언문은 호이스팅되므로 먼저 호출해도 된다.
function getBlockchain() { return blockchain; }
function getLatestBlock() { return blockchain[blockchain.length - 1]; }
// ### 1.17 crypto-js 라이브러리 설치
// $ npm install crypto-js --save
// 1.18 블록 해시 계산 (책 순서 #8)
// (코드 시작부로) const CryptoJS = require("crypto-js");
function calculateHash(version, index, previousHash, timestamp, merkleRoot) {
    return CryptoJS.SHA256(version + index + previousHash + timestamp + merkleRoot).toString().toUpperCase();
}
// 1.19 블록을 인자로 하는 블록 해시 계산 (책 순서 #9)
function calculateHashForBlock(block) {
    return calculateHash(
        block.header.version,
        block.header.index,
        block.header.previousHash,
        block.header.timestamp,
        block.header.merkleRoot
    );
}
// ### 1.20 merkle 라이브러리 설치
// $ npm install merkle --save
// 1.21 제네시스 블록 (책 순서 #5)
// (코드 시작부로) const merkle = require("merkle");
function getGenesisBlock() {
    const version = "1.0.0";
    const index = 0;
    const previousHash = '0'.repeat(64);
    const timestamp = 1231006505; // 01/03/2009 @ 6:15pm (UTC)
    const data = ["The times 03/Jan/2009 Chancellor on brick of second bailout for banks"];

    const merkleTree = merkle("sha256").sync(data);
    const merkleRoot = merkleTree.root() || '0'.repeat(64);

    const header = new BlockHeader(version, index, previousHash, timestamp, merkleRoot);
    return new Block(header, data);
}
// 1.22 수정된 블록체인 선언 (책 순서 #3)
var blockchain = [getGenesisBlock()];
// ### 1.23 블록 생성 (책 순서 #6)
// merkleRoot: 만일 블록 데이터가 비어있다면 머클 루트는 '0'.repeat(64)로 초기화된다.
// getCurrentTimestamp: 현재 시간을 초 단위의 Unix 타임스탬프(1970/1/1 UTC 기준 경과 시간)로 반환한다.
// (...) Date().getTime()은 밀리초를 반환하므로 1000으로 나눠야 초가 나온다.
function generateNextBlock(blockData) {
    const previousBlock = getLatestBlock();
    const currentVersion = getCurrentVersion();
    const nextIndex = previousBlock.header.index + 1;
    const previousHash = calculateHashForBlock(previousBlock);
    const nextTimestamp = getCurrentTimestamp();

    const merkleTree = merkle("sha256").sync(blockData);
    const merkleRoot = merkleTree.root() || '0'.repeat(64);

    const newBlockHeader = new BlockHeader(currentVersion, nextIndex, previousHash, nextTimestamp, merkleRoot);
    return new Block(newBlockHeader, blockData);
}
// (코드 시작부로) const fs = require("fs");
function getCurrentVersion() {
    const packageJson = fs.readFileSync("./package.json");
    const currentVersion = JSON.parse(packageJson).version;
    return currentVersion;
}
function getCurrentTimestamp() {
    return Math.round(new Date().getTime() / 1000);
}
// ### 1.24 블록 검증 (책 순서 #10)
// newBlock.data.length !== 0: 검증할 새 블록에 data가 있을 경우 머클 루트 계산한 값이 검증 블록에 적힌 값과 같아야 한다. 
// newBlock.data.length === 0: 검증할 새 블록에 data가 없을 경우 '0'.repeat(64) 값이 검증 블록에 접힌 값이어야 한다.
function isValidNewBlock(newBlock, previousBlock) {
    if (!isValidBlockStructure(newBlock)) {
        console.log('invalid block structure: %s', JSON.stringify(newBlock));
        return false;
    }
    else if (previousBlock.header.index + 1 !== newBlock.header.index) {
        console.log("Invalid index");
        return false;
    }
    else if (calculateHashForBlock(previousBlock) !== newBlock.header.previousHash) {
        console.log("Invalid previousHash");
        return false;
    }
    else if (
        (newBlock.data.length !== 0
            && (merkle("sha256").sync(newBlock.data).root() !== newBlock.header.merkleRoot)
        )
        || (newBlock.data.length === 0
            && ('0'.repeat(64) !== newBlock.header.merkleRoot)
        )
    ) {
        console.log("Invalid merkleRoot");
        return false;
    }
    return true;
}
// 1.25 블록 구조의 유효성 검증 (책 순서 #11)
function isValidBlockStructure(block) {
    return typeof(block.header.version) === 'string'
    && typeof(block.header.index) === 'number'
    && typeof(block.header.previousHash) === 'string'
    && typeof(block.header.timestamp) === 'number'
    && typeof(block.header.merkleRoot) === 'string'
    && typeof(block.data) === 'object';
}
// 1.26 블록체인 검증 (책 순서 #12)
// 신뢰를 부여하려면 어느 시점에서든 블록과 블록체인의 무결성 검증이 가능해야 한다.
// JSON.stringify !==: 첫 번째 블록이 하드코딩된 제네시스 블록의 정의와 일치하는지 검사해야 한다.
// for: 구현한 블록체인이 블록 배열이므로, 블록 검증을 반복하는 것으로 블록체인을 검증할 수 있다.
function isValidChain(blockchainToValidate) {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
        return false;
    }
    var tempBlocks = [blockchainToValidate[0]];
    for (var i = 1; i < blockchainToValidate.length; i++) {
        if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
            tempBlocks.push(blockchainToValidate[i]);
        }
        else { return false; }
    }
    return true;
}
// 1.27 블록 추가 (책 순서 #7)
// 생성한 블록 또는 전파받은 블록이 유효하다면 원장을 업데이트한다.
function addBlock(newBlock) {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
        return true;
    }
    return false;
}