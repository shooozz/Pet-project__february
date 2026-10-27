#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Central Bank of Russia API URLs
const CBR_CURRENT_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

async function getExchangeRate(dateStr = null) {
  try {
    let url = CBR_CURRENT_URL;
    if (dateStr) {
      url = `https://www.cbr-xml-daily.ru/archive/${dateStr}/daily_json.js`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.Valute.USD.Value;
  } catch (error) {
    return null;
  }
}

function getPreviousBusinessDay() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // If it's Monday, go back 3 days (to Friday)
  // If it's Sunday, go back 2 days (to Friday)
  const day = yesterday.getDay();
  if (day === 0) {
    // Sunday
    yesterday.setDate(yesterday.getDate() - 2);
  } else if (day === 1) {
    // Monday
    yesterday.setDate(yesterday.getDate() - 3);
  }

  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const date = String(yesterday.getDate()).padStart(2, '0');

  return `${year}/${month}/${date}`;
}

async function generateReport() {
  // Get current rate
  const currentRate = await getExchangeRate();
  if (currentRate === null) {
    console.error('Failed to get current exchange rate');
    process.exit(1);
  }

  // Get previous business day's rate
  const previousBusinessDay = getPreviousBusinessDay();
  const previousRate = await getExchangeRate(previousBusinessDay);

  // Calculate changes
  let changeAbsolute = 0;
  let changePercent = 0;
  let direction = 'стабилен';

  if (previousRate !== null && previousRate > 0) {
    changeAbsolute = currentRate - previousRate;
    changePercent = (changeAbsolute / previousRate) * 100;

    if (changeAbsolute > 0) {
      direction = 'вырос';
    } else if (changeAbsolute < 0) {
      direction = 'снизился';
    }
  }

  // Format numbers for Russian locale (use comma as decimal separator)
  const formatNumber = (num) => {
    return num.toFixed(2).replace('.', ',');
  };

  const currentRateFormatted = formatNumber(currentRate);
  const changeAbsoluteFormatted = formatNumber(Math.abs(changeAbsolute));
  const changePercentFormatted = formatNumber(Math.abs(changePercent));
  const changeSign = changeAbsolute >= 0 ? '+' : '−';

  // Prepare report
  let report = `Курс доллара: ${currentRateFormatted} ₽\n\n`;
  report += `Изменение:\n`;
  report += `${changeSign}${changeAbsoluteFormatted} ₽ (${changeSign}${changePercentFormatted}%)\n\n`;

  // Add brief explanation if we have previous rate
  if (previousRate !== null) {
    report += `Краткое объяснение:\n`;
    if (previousRate !== null) {
      if (Math.abs(changePercent) < 0.5) {
        report += `Доллар практически не изменился по отношению к рублю за последний день. `;
      } else if (Math.abs(changePercent) < 1) {
        report += `Произошло небольшое ${direction === 'вырос' ? 'усиление' : 'ослабление'} доллара (${changePercentFormatted}%). `;
      } else {
        report += `Доллар значительно ${direction} к рублю (на ${changePercentFormatted}%). `;
      }
      report += `Движение курса может быть связано с изменениями в геополитической ситуации, макроэкономическими показателями или действиями Центробанка.\n\n`;
    }
  }

  report += `Источник курса:\nБанк России\n`;

  return report;
}

async function main() {
  const report = await generateReport();
  console.log(report);

  // Send email
  try {
    const { exec: execCallback } = await import('child_process');
    const { spawn } = await import('child_process');

    const child = spawn('node', ['send-email.mjs', 'Курс доллара — ежедневный отчет']);
    child.stdin.write(report);
    child.stdin.end();

    child.on('close', (code) => {
      if (code !== 0) {
        process.exit(code);
      }
    });
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    process.exit(1);
  }
}

main();
