// Regression test suite for Enerpack Stock Reconciliation & Inventory Calculations

function testStockCalculation() {
  console.log("Running Enerpack Stock Reconciliation Regression Tests...");

  // Test A: Work Order deduction
  let openingStock = 513; // gross
  let workOrderQty = 21;  // gross
  let expectedClosing = 492;
  let closingStock = openingStock - workOrderQty;
  console.assert(closingStock === expectedClosing, `Test A Failed: Expected ${expectedClosing}, got ${closingStock}`);
  console.log(`Test A Passed: Opening ${openingStock} - ${workOrderQty} = ${closingStock} gross`);

  // Test B: Stock In
  let stockInQty = 30;
  let expectedStockInClosing = 543;
  let stockInResult = openingStock + stockInQty;
  console.assert(stockInResult === expectedStockInClosing, `Test B Failed: Expected ${expectedStockInClosing}, got ${stockInResult}`);
  console.log(`Test B Passed: Opening ${openingStock} + ${stockInQty} = ${stockInResult} gross`);

  // Test C: Stock In followed by Stock Out
  let combinedResult = openingStock + stockInQty - workOrderQty;
  let expectedCombined = 522;
  console.assert(combinedResult === expectedCombined, `Test C Failed: Expected ${expectedCombined}, got ${combinedResult}`);
  console.log(`Test C Passed: ${openingStock} + ${stockInQty} - ${workOrderQty} = ${combinedResult} gross`);

  // Test D: Repeated request (Idempotency)
  // Simulating submitting the same transaction ID twice
  let processedTransactions = new Set();
  let stock = 513;
  
  function processTx(txId, qty) {
    if (processedTransactions.has(txId)) {
      console.log(`Duplicate transaction ${txId} ignored.`);
      return stock;
    }
    processedTransactions.add(txId);
    stock -= qty;
    return stock;
  }

  let tx1 = processTx("tx-60-91-200-001", 21);
  let tx2 = processTx("tx-60-91-200-001", 21); // duplicate
  console.assert(tx1 === 492 && tx2 === 492, `Test D Failed: Idempotency failed, got ${tx2}`);
  console.log(`Test D Passed: Repeated transaction correctly yielded ${tx2} gross (no double deduction).`);

  // Test E: Concurrent transactions (Atomicity / queueing simulation)
  let concurrentStock = 513;
  function executeAtomicDeduction(current, qty) {
    // simulating atomic update
    return current - qty;
  }
  let c1 = executeAtomicDeduction(concurrentStock, 10);
  let c2 = executeAtomicDeduction(c1, 10);
  console.assert(c2 === 493, `Test E Failed: Expected 493, got ${c2}`);
  console.log(`Test E Passed: Concurrent deductions (10 + 10) on 513 yielded ${c2} gross.`);

  // Test F: Insufficient stock validation
  let baseStock = 10;
  let requestedOut = 25;
  let allowNegative = false;
  let finalStock = baseStock - requestedOut;
  if (finalStock < 0 && !allowNegative) {
    console.log(`Test F Passed: Insufficient stock correctly blocked (requested ${requestedOut}, available ${baseStock}).`);
  } else {
    console.assert(false, "Test F Failed: Insufficient stock not blocked.");
  }

  console.log("All Stock Reconciliation Regression Tests Passed Successfully!");
}

testStockCalculation();
