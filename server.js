import * as db from './database/database.js';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import ssim from 'string-similarity';


const app = express();
app.use(express.static('src', { extensions: ['html'] }));

// const uploader = multer({storage: storage }).array('files', 3);
const uploader = multer({ dest: 'uploads' });

// Checks whether there is more than 1 file
async function uploadFileCheck(req, res) {
  if (req.files.length <= 1) {
    await uploadSingle(req, res);
  } else {
    await uploadMultiple(req, res);
  }
}

// Function for multiple files checking
async function uploadMultiple(req, res) {
  const userFiles = await req.files;

  const filesToCompare = await addMultipleToDB(userFiles);

  const fileChecker = await checkMultiFilePlag(filesToCompare[0], filesToCompare[1]);

  res.json(fileChecker);
}

async function addMultipleToDB(userFiles) {
  const filesToCompare = [];

  await userFiles.forEach(file => {
    const filename = file.originalname;
    const newfilename = file.filename;
    db.addFile(filename, newfilename);
    filesToCompare.push({ name: filename, filepath: newfilename });
  });

  return filesToCompare;
}

// Function for single files checking / uploads
async function uploadSingle(req, res) {
  const userFiles = await req.files;

  const filename = userFiles[0].originalname;
  const newfilename = userFiles[0].filename;

  const filesToDb = await db.addFile(filename, newfilename);

  const fileChecker = await checkFilePlag(filename, newfilename, filesToDb);
  const lineChecker = await checkLinePlag(filename, newfilename, filesToDb);

  const finalChecker = { file: fileChecker, line: lineChecker };

  console.log(finalChecker);

  res.json(finalChecker);
}

async function checkFilePlag(name, filepath, dbfilepath) {
  const similarityData = [];
  const data1 = fs.readFileSync('./uploads/' + filepath, 'utf8');

  await dbfilepath.forEach(file => {
    if (file.filepath !== filepath) {
      const data2 = fs.readFileSync('./uploads/' + file.filepath, 'utf8');
      // console.log(data2.split(/\r?\n/));
      const similar = ssim.compareTwoStrings(data1, data2);
      similarityData.push({ filename1: name, filename2: file.name, similar: similar, type: 'file' });
    }
  });

  // console.log(similarityData);
  return similarityData;
}

async function checkMultiFilePlag(file1, file2) {
  const similarityData = [];

  const data1 = fs.readFileSync('./uploads/' + file1.filepath, 'utf8');

  const data2 = fs.readFileSync('./uploads/' + file2.filepath, 'utf8');

  const similar = ssim.compareTwoStrings(data1, data2);
  await similarityData.push({ filename1: file1.name, filename2: file2.name, similar: similar, type: 'file' });

  return similarityData;
}


async function checkLinePlag(name, filepath, dbfilepath) {
  const similarityData = [];
  let simCounter = 0;

  const data1 = fs.readFileSync('./uploads/' + filepath, 'utf8');
  const lineData1 = data1.split(/\r?\n/);

  await dbfilepath.forEach(file => {
    if (file.filepath !== filepath) {
      const data2 = fs.readFileSync('./uploads/' + file.filepath, 'utf8');
      const lineData2 = data2.split(/\r?\n/);

      for (let i = 0; i < lineData1.length; i++) {
        if (lineData1[i] !== '' && lineData1[i] !== '}') {
          for (let j = 0; j < lineData2.length; j++) {
            if (lineData2[j] !== '' && lineData2[j] !== '}') {
              const lineSim = ssim.compareTwoStrings(lineData1[i], lineData2[j]);
              simCounter += lineSim;
            }
          }
          simCounter = simCounter / lineData2.length;
        }
      }
      similarityData.push({ filename1: name, filename2: file.name, similar: simCounter, type: 'line' });
    }
  });
  return similarityData;
}

async function getAll(req, res) {
  // console.log(await db.getID());
  res.json(await db.getAll());
}

function asyncWrap(f) {
  return (req, res, next) => {
    Promise.resolve(f(req, res, next))
      .catch((e) => next(e || new Error()));
  };
}

// app.get('/test', express.json(), asyncWrap(getTest));
app.post('/upload', uploader.array('files'), express.json(), asyncWrap(uploadFileCheck));
app.get('/getData', asyncWrap(getAll));

console.log('Running');
app.listen(8080);
