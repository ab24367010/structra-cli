#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import os from 'os';
import tree from 'tree-node-cli';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(os.homedir(), '.structra-config.json');

console.log(chalk.cyan.bold('\n🚀 Welcome to Structra CLI v1.1\n'));

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.log(chalk.red('⚠️ Тохиргоог хадгалах үед алдаа гарлаа.'));
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    console.log(chalk.red('⚠️ Тохиргоог унших үед алдаа гарлаа.'));
  }
  return {};
}

async function main() {
  const userConfig = loadConfig();

  const { projectPath } = await inquirer.prompt({
    type: 'input',
    name: 'projectPath',
    message: '📁 Хаана төсөл үүсгэх вэ? (path)',
    default: userConfig.lastPath || process.cwd()
  });

  const { projectName } = await inquirer.prompt({
    type: 'input',
    name: 'projectName',
    message: '📝 Төслийн нэр:'
  });

  const fullPath = path.join(projectPath, projectName);

  try {
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(chalk.green(`\n✅ Төсөл үүсгэлээ: ${fullPath}\n`));
    } else {
      console.log(chalk.red('\n❌ Төслийн фолдер аль хэдийн байна.\n'));
      return;
    }
  } catch (err) {
    console.log(chalk.red(`\n❌ Алдаа гарлаа: ${err.message}\n`));
    return;
  }

  const { wantsIndex } = await inquirer.prompt({
    type: 'confirm',
    name: 'wantsIndex',
    message: '📄 index.html үүсгэх үү?',
    default: true
  });

  if (wantsIndex) {
    fs.writeFileSync(path.join(fullPath, 'index.html'), '<!-- Welcome to Structra -->');
    console.log(chalk.yellow('🗎 index.html үүсгэгдлээ'));
  }

  // README.md автоматаар үүсгэх
  fs.writeFileSync(path.join(fullPath, 'README.md'), `# ${projectName}\n\nЭнэ төслийг Structra CLI ашиглан үүсгэсэн.`);
  console.log(chalk.yellow('🗎 README.md үүсгэгдлээ'));

  // Хамгийн сүүлийн замыг хадгалах
  saveConfig({ lastPath: projectPath });

  await askToAddFileOrFolder(fullPath);

  console.log(chalk.cyan('\n📂 Төслийн бүтэц:'));
  console.log(tree(fullPath));
}

async function askToAddFileOrFolder(currentPath) {
  while (true) {
    const { choice } = await inquirer.prompt({
      type: 'list',
      name: 'choice',
      message: `📌 ${currentPath} дотор юу үүсгэх вэ?`,
      choices: ['📁 Folder', '📄 File', '👁 Preview', '✅ Дуусгах']
    });

    if (choice === '✅ Дуусгах') break;

    if (choice === '👁 Preview') {
      console.log(chalk.blue('\n🧭 Бүтэц Preview:'));
      console.log(tree(currentPath));
      continue;
    }

    const { names } = await inquirer.prompt({
      type: 'input',
      name: 'names',
      message: `${choice === '📁 Folder' ? 'Фолдерууд' : 'Файл(ууд)'} нэр (комагаар тусгаарлан бич):`
    });

    const nameList = names.split(',').map(n => n.trim()).filter(n => n);

    for (const name of nameList) {
      const targetPath = path.join(currentPath, name);
      try {
        if (choice === '📁 Folder') {
          fs.mkdirSync(targetPath);
          console.log(chalk.green(`✅ Фолдер үүсгэгдлээ: ${name}`));
        } else {
          fs.writeFileSync(targetPath, '');
          console.log(chalk.green(`✅ Файл үүсгэгдлээ: ${name}`));
        }
      } catch (err) {
        console.log(chalk.red(`❌ Алдаа (${name}): ${err.message}`));
      }
    }

    if (choice === '📁 Folder' && nameList.length === 1) {
      const { inside } = await inquirer.prompt({
        type: 'list',
        name: 'inside',
        message: '➡️ Энэ фолдер руу орох уу?',
        choices: ['🔽 Орох', '🔼 Үргэлжлүүлэх']
      });
      if (inside === '🔽 Орох') {
        await askToAddFileOrFolder(path.join(currentPath, nameList[0]));
      }
    }
  }
}

main();
