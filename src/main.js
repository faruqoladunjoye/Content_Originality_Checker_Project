
async function upload() {
  if (fileToUpload.files.length) {
    const payload = new FormData();
    loading(true);
    if (fileToUpload.files.length > 1 && fileToUpload.files.length <= 2) {
      for (let i = 0; i < fileToUpload.files.length; i++) {
        payload.append('files', fileToUpload.files[i]);
      }
    } else if (fileToUpload.files.length <= 1) {
      payload.append('files', fileToUpload.files[0]);
    } else {
      outputError('Too many files');
    }
    const response = await fetch('upload', {
      method: 'POST',
      body: payload,
    });

    if (response.ok) {
      const content = await response.json();
      console.log(content);
      if (content.file === undefined) {
        loading(false);
        multiFileComparison(content);
      } else if (content.file.length === 0 || content.line.length === 0) {
        loading(false);
        outputError('No files in the database to check');
      } else {
        loading(false);
        overallPlag(content.file, content.line);
        filePairs(content.file);
      }
    } else {
      loading(false);
      console.log('failed');
    }
  } else {
    loading(false);
    outputError('No File selected');
  }
}

function multiFileComparison(fileData) {
  const userFileName1 = document.querySelector('#userMultiFileName1');
  const userFileName2 = document.querySelector('#userMultiFileName2');
  const userFileSimilar = document.querySelector('#userMultiFileSimilar');
  const reportArea = document.querySelector('#reportArea');
  const reportAreaMulti = document.querySelector('#reportAreaMulti');

  const comparedFileData = fileData[0];

  userFileName1.textContent = comparedFileData.filename1;
  userFileName2.textContent = comparedFileData.filename2;


  reportArea.classList.add('hidden');
  reportAreaMulti.classList.remove('hidden');

  const similarPercent = Math.round(comparedFileData.similar * 100);
  userFileSimilar.textContent = `${similarPercent}%`;
}

async function overallPlag(fileData, lineData) {
  console.log(fileData, lineData);
  const userFileName1 = document.querySelector('#userFileName1');
  const userFileName2 = document.querySelector('#userFileName2');
  const plagPercent = document.querySelector('#overallPlagPercent');
  const filesCompared = document.querySelector('#numberCompared');
  const reportArea = document.querySelector('#reportArea');
  const reportAreaMulti = document.querySelector('#reportAreaMulti');


  let fileCounter = 0;
  let filePercent = 0;
  let linePercent = 0;

  await fileData.forEach(file => {
    filePercent += file.similar;
    fileCounter++;
  });

  await lineData.forEach(file => {
    linePercent += file.similar;
  });

  filePercent = filePercent / fileCounter;
  linePercent = linePercent / fileCounter;

  const overallPercent = Math.round(((filePercent + linePercent) * 100) / 2);

  userFileName1.textContent = fileData[0].filename1;
  userFileName2.textContent = fileData[0].filename1;
  plagPercent.textContent = `${overallPercent}%`;
  filesCompared.textContent = `${fileCounter}`;

  reportAreaMulti.classList.add('hidden');
  reportArea.classList.remove('hidden');

  detailedReport(filePercent, linePercent);
}

function detailedReport(filePercent, linePercent) {
  const filePlagPercent = document.querySelector('#filePlagPercent');
  const fileUniquePercent = document.querySelector('#fileUniquePercent');

  const linePlagPercent = document.querySelector('#linePlagPercent');
  const lineUniquePercent = document.querySelector('#lineUniquePercent');

  const fileBar = document.querySelector('.filePlagBar');
  const lineBar = document.querySelector('.linePlagBar');

  filePercent = Math.round(filePercent * 100);
  linePercent = Math.round(linePercent * 100);

  filePlagPercent.textContent = `${filePercent}%`;
  fileUniquePercent.textContent = `${100 - filePercent}%`;

  linePlagPercent.textContent = `${linePercent}%`;
  lineUniquePercent.textContent = `${100 - linePercent}%`;

  fileBar.style.width = `${filePercent * 5}px`;
  lineBar.style.width = `${linePercent * 5}px`;
}

function filePairs(fileData) {
  const fileList = document.querySelector('#filePairList');

  fileData.forEach(file => {
    const newList = document.createElement('li');
    const file1 = file.filename1;
    const file2 = file.filename2;
    const fileSimilarity = Math.round(file.similar * 100);

    newList.textContent = `${file1} is ${fileSimilarity}% similar compared to ${file2}`;
    fileList.appendChild(newList);
  });
}

function moreDetail() {
  const moreDetailBtn = document.querySelector('#detailedReportArea');
  moreDetailBtn.classList.remove('hidden');
}


function showFiles() {
  const fileText = document.querySelector('#fileName');
  while (fileText.firstChild) {
    fileText.removeChild(fileText.lastChild);
  }

  if (fileToUpload.files.length > 2) {
    outputError('Too many files');
  } else if (fileToUpload.files.length > 1) {
    for (let i = 0; i < fileToUpload.files.length; i++) {
      const newSpan = document.createElement('span');
      newSpan.textContent = `File: ${fileToUpload.files[i].name}`;
      fileText.appendChild(newSpan);
    }
  } else {
    fileText.textContent = `File: ${fileToUpload.files[0].name}`;
  }
}

function outputError(data) {
  const errorText = document.querySelector('#fileName');
  errorText.textContent = data;
}

function handleData(e) {
  opacityChange(1);
  e.preventDefault();
  fileToUpload.files = e.dataTransfer.files;
  console.log(fileToUpload.files);
  showFiles();
}

function opacityChange(opacityValue) {
  mainArea.style.opacity = `${opacityValue}`;
  console.log(opacityValue);
}

function loading(load) {
  const overlay = document.querySelector('.loadingOverlay');
  const main = document.querySelector('.mainPage');

  if (load === true) {
    main.style.opacity = 0.6;
    overlay.classList.remove('hidden');
  } else {
    main.style.opacity = 1;
    overlay.classList.add('hidden');
  }
}

function dragOverHandler(e) {
  opacityChange(0.6);
  e.preventDefault();
}
function dragLeaveHandler(e) {
  opacityChange(1);
  e.preventDefault();
}

const mainArea = document.querySelector('.dropFileArea');
mainArea.addEventListener('dragover', dragOverHandler);
mainArea.addEventListener('dragleave', dragLeaveHandler);
mainArea.addEventListener('drop', handleData);

const fileToUpload = document.querySelector('#fileInput');
fileToUpload.addEventListener('change', showFiles);

const checkPlagBtn = document.querySelector('#checkPlagBtn');
checkPlagBtn.addEventListener('click', upload);

const moreDetailBtn = document.querySelector('#moreDetailBtn');
moreDetailBtn.addEventListener('click', moreDetail);
