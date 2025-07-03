#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import os from 'os';
import tree from 'tree-node-cli';
// package.json-г import assertion ашиглан унших (Node.js v16.14+ шаардлагатай)
import pkg from './package.json' assert { type: 'json' };

const configPath = path.join(os.homedir(), '.structra-config.json');

// Алдааг нэгдсэн байдлаар барих функц
const handleError = (err) => {
  console.error(chalk.red(`\n❌ Уучлаарай, алдаа гарлаа: ${err.message}`));
  process.exit(1);
};

// Баригдаагүй promise rejection-г энд барина
process.on('unhandledRejection', handleError);

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.log(chalk.yellow('⚠️ Тохиргоог хадгалах үед алдаа гарлаа.'));
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    console.log(chalk.yellow('⚠️ Тохиргоог унших үед алдаа гарлаа.'));
  }
  return {};
}

async function askToAddFileOrFolder(currentPath) {
  while (true) {
    console.log(chalk.blue.bold('\nТөслийн одоогийн бүтэц:'));
    const currentTree = tree(currentPath, { allFiles: true, maxDepth: 4 });
    console.log(currentTree || chalk.yellow('Хоосон байна.'));

    const { choice } = await inquirer.prompt({
      type: 'list',
      name: 'choice',
      message: '➡️ Юу нэмэх вэ?',
      choices: ['📁 Фолдер', '📄 Файл', new inquirer.Separator(), '✅ Бүтэц үүсгэж дуусгах'],
    });

    if (choice === '✅ Бүтэц үүсгэж дуусгах') {
      break;
    }

    const { name } = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: `"${choice}" нэр (олон бол зайгаар тусгаарла):`,
      validate: function (input) {
        if (!input.trim()) {
            return 'Нэр хоосон байж болохгүй.';
        }
        // Файл болон фолдерын нэрэнд ашиглах боломжгүй тэмдэгтүүдийг шалгах
        if (/[<>:"/\\|?*]/g.test(input)) {
            return 'Файл/фолдерын нэрэнд < > : " / \\ | ? * тэмдэгтүүдийг ашиглах болохгүй.';
        }
        return true;
      }
    });

    const nameList = name.split(' ').filter(n => n);

    for (const singleName of nameList) {
      const targetPath = path.join(currentPath, singleName);

      try {
        if (fs.existsSync(targetPath)) {
          console.log(chalk.yellow(`⚠️ "${singleName}" нэртэй файл/фолдер аль хэдийн байна.`));
          continue;
        }

        if (choice === '📁 Фолдер') {
          fs.mkdirSync(targetPath);
          console.log(chalk.green(`✅ Фолдер үүсгэгдлээ: ${singleName}`));
        } else {
          fs.writeFileSync(targetPath, '');
          console.log(chalk.green(`✅ Файл үүсгэгдлээ: ${singleName}`));
        }
      } catch (err) {
        console.log(chalk.red(`❌ Алдаа (${singleName}): ${err.message}`));
      }
    }

    if (choice === '📁 Фолдер' && nameList.length === 1) {
      const { inside } = await inquirer.prompt({
        type: 'list',
        name: 'inside',
        message: `➡️ "${nameList[0]}" фолдер руу орж, дотор нь үүсгэх үү?`,
        choices: ['🔽 Тийм, оръё', '🔼 Үгүй, үргэлжлүүлье']
      });
      if (inside === '🔽 Тийм, оръё') {
        await askToAddFileOrFolder(path.join(currentPath, nameList[0]));
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`Structra CLI v${pkg.version}`);
    process.exit(0);
  }
  
  // Uninstall логикийг хассан.

  console.log(chalk.cyan.bold(`\n🚀 Structra CLI v${pkg.version}-д тавтай морил!\n`));
  
  const userConfig = loadConfig();

  const { projectPath } = await inquirer.prompt({
    type: 'input',
    name: 'projectPath',
    message: '📁 Төслийг хаана үүсгэх вэ? (зам)',
    default: userConfig.lastPath || os.homedir(),
  });

  if (!fs.existsSync(projectPath)) {
    console.log(chalk.yellow('📂 Уг замд хавтас олдсонгүй. Шинээр үүсгэж байна...'));
    try {
      fs.mkdirSync(projectPath, { recursive: true });
      console.log(chalk.green('✅ Хавтас амжилттай үүслээ.'));
    } catch (err) {
        handleError(new Error(`Хавтас үүсгэхэд алдаа гарлаа: ${err.message}`));
    }
  }

  userConfig.lastPath = projectPath;
  saveConfig(userConfig);

  const { projectName } = await inquirer.prompt({
    type: 'input',
    name: 'projectName',
    message: '📝 Төслийн нэрийг оруулна уу:',
    default: 'my-new-project',
    validate: (input) => input.trim() ? true : 'Төслийн нэр хоосон байж болохгүй.'
  });

  const projectFullPath = path.join(projectPath, projectName);

  if (fs.existsSync(projectFullPath)) {
    const { overwrite } = await inquirer.prompt({
        type: 'confirm',
        name: 'overwrite',
        message: chalk.yellow(`"${projectName}" нэртэй хавтас аль хэдийн байна. Устгаад шинээр үүсгэх үү?`),
        default: false
    });
    if(!overwrite) {
        console.log(chalk.red('❌ Үйлдэл цуцлагдлаа.'));
        process.exit(0);
    }
    fs.rmSync(projectFullPath, { recursive: true, force: true });
  }

  fs.mkdirSync(projectFullPath);
  console.log(chalk.green(`\n✅ Төслийн үндсэн хавтас үүслээ: ${projectFullPath}`));

  const { createDefaults } = await inquirer.prompt({
      type: 'checkbox',
      name: 'createDefaults',
      message: '⚙️ Үндсэн файлуудаас сонгож үүсгэнэ үү:',
      choices: [
          { name: 'index.html', checked: true },
          { name: 'README.md', checked: true },
          { name: 'css/style.css', checked: false },
          { name: 'js/main.js', checked: false }
      ]
  });

  if(createDefaults.includes('index.html')) {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  ${createDefaults.includes('css/style.css') ? '<link rel="stylesheet" href="css/style.css">' : ''}
</head>
<body>
  <h1>Welcome to ${projectName}</h1>
  ${createDefaults.includes('js/main.js') ? '<script src="js/main.js"></script>' : ''}
</body>
</html>`;
    fs.writeFileSync(path.join(projectFullPath, 'index.html'), htmlContent);
    console.log(chalk.green('✅ `index.html` үүслээ.'));
  }

  if(createDefaults.includes('README.md')) {
      fs.writeFileSync(path.join(projectFullPath, 'README.md'), `# ${projectName}`);
      console.log(chalk.green('✅ `README.md` үүслээ.'));
  }

  if(createDefaults.includes('css/style.css')) {
      fs.mkdirSync(path.join(projectFullPath, 'css'), { recursive: true });
      fs.writeFileSync(path.join(projectFullPath, 'css/style.css'), '/* Your styles here */');
      console.log(chalk.green('✅ `css/style.css` үүслээ.'));
  }

  if(createDefaults.includes('js/main.js')) {
      fs.mkdirSync(path.join(projectFullPath, 'js'), { recursive: true });
      fs.writeFileSync(path.join(projectFullPath, 'js/main.js'), '// Your scripts here');
      console.log(chalk.green('✅ `js/main.js` үүслээ.'));
  }

  const { continueWithCustom } = await inquirer.prompt({
      type: 'confirm',
      name: 'continueWithCustom',
      message: '🔧 Нэмэлтээр файл/фолдер үүсгэх үү?',
      default: true
  });

  if (continueWithCustom) {
      await askToAddFileOrFolder(projectFullPath);
  }

  console.log(chalk.blue.bold('\n✨ Төслийн эцсийн бүтэц:'));
  const finalTree = tree(projectFullPath, { allFiles: true });
  console.log(finalTree);

  console.log(chalk.cyan.bold('\n🎉 Structra CLI ашигласанд баярлалаа! Таны ажилд амжилт хүсье!\n'));
}

main().catch(handleError);