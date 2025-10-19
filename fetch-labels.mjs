#!/usr/bin/env node

/**
 * Fetches known addresses from Aptos Explorer and normalizes them
 * Run with: node fetch-labels.mjs
 */

const EXPLORER_URL = 'https://raw.githubusercontent.com/aptos-labs/explorer/main/src/constants.tsx';

// Simple address normalization (mimics AccountAddress.from().toString())
function normalizeAddress(hexString) {
  // Remove 0x prefix if present
  let hex = hexString.toLowerCase().replace(/^0x/, '');

  // Remove leading zeros
  hex = hex.replace(/^0+/, '') || '0';

  // Keep special addresses (0x1 - 0xf) short, pad others to 64 characters
  if (hex.length <= 1 && parseInt(hex, 16) <= 0xf) {
    return '0x' + hex;
  }

  // Pad to 64 characters (32 bytes)
  hex = hex.padStart(64, '0');

  // Add 0x prefix back
  return '0x' + hex;
}

async function fetchKnownAddresses() {
  try {
    console.error('Fetching from Aptos Explorer...');
    const response = await fetch(EXPLORER_URL);
    const content = await response.text();

    // Extract the knownAddresses object
    const match = content.match(/export const knownAddresses[^{]*({[\s\S]*?})\s*;/);

    if (!match) {
      throw new Error('Could not find knownAddresses in the source file');
    }

    // Parse the object - need to handle TypeScript object literal syntax
    const objectString = match[1];

    // Extract key-value pairs - handles multi-line format
    // Matches: "0xADDRESS": followed by optional whitespace/newline and "Label"
    const pairs = {};
    const regex = /["']([^"']+)["']\s*:\s*["']([^"']+)["']/gs;
    let regexMatch;

    while ((regexMatch = regex.exec(objectString)) !== null) {
      const address = regexMatch[1];
      const label = regexMatch[2];
      const normalized = normalizeAddress(address);
      pairs[normalized] = label;
    }

    console.log(JSON.stringify(pairs, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fetchKnownAddresses();
