#!/usr/bin/env node

/**
 * Fetches known addresses from Aptos Explorer and normalizes them
 * Run with: node fetch-labels.mjs
 */

const EXPLORER_URL = 'https://raw.githubusercontent.com/aptos-labs/explorer/main/app/data/mainnet/knownAddresses.ts';

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
    const response = await fetch(EXPLORER_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    const content = await response.text();

    // Helper to extract address-label pairs from an object string
    function extractPairs(objectString) {
      const pairs = {};
      const regex = /["']([^"']+)["']\s*:\s*["']([^"']+)["']/gs;
      let regexMatch;
      while ((regexMatch = regex.exec(objectString)) !== null) {
        const address = regexMatch[1];
        const label = regexMatch[2];
        const normalized = normalizeAddress(address);
        pairs[normalized] = label;
      }
      return pairs;
    }

    // Extract mainnetKnownAddresses
    const knownMatch = content.match(/export const mainnetKnownAddresses[^{]*({[\s\S]*?});/);
    if (!knownMatch) {
      throw new Error('Could not find mainnetKnownAddresses in the source file');
    }
    const knownPairs = extractPairs(knownMatch[1]);

    // Extract mainnetScamAddresses
    const scamMatch = content.match(/export const mainnetScamAddresses[^{]*({[\s\S]*?});/);
    if (!scamMatch) {
      throw new Error('Could not find mainnetScamAddresses in the source file');
    }
    const scamPairs = extractPairs(scamMatch[1]);

    // Merge both (scam addresses will override if there are duplicates)
    const allPairs = { ...knownPairs, ...scamPairs };

    console.log(JSON.stringify(allPairs, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fetchKnownAddresses();
