const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 Starting Gender Switch Test...\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Avatar switch') || text.includes('button') || text.includes('Gender')) {
            console.log('📄 PAGE:', text);
        }
    });

    try {
        console.log('📍 Navigating to http://localhost:3000/...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

        // Wait for the page to load
        await page.waitForSelector('#switch-male', { timeout: 5000 });
        console.log('✅ Page loaded successfully\n');

        // Test 1: Check initial state
        console.log('TEST 1: Checking initial state...');
        const initialClass = await page.evaluate(() => document.body.className);
        const initialBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundImage);
        console.log('  Body class:', initialClass);
        console.log('  Background:', initialBg.includes('male') ? '✅ MALE avatar' : '❌ Not male');

        const maleActive = await page.evaluate(() =>
            document.getElementById('switch-male').classList.contains('active')
        );
        console.log('  Male button active:', maleActive ? '✅ YES' : '❌ NO');
        console.log('');

        // Test 2: Click Female button
        console.log('TEST 2: Clicking FEMALE button...');
        await page.click('#switch-female');
        await page.waitForTimeout(500);

        const femaleClass = await page.evaluate(() => document.body.className);
        const femaleBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundImage);
        console.log('  Body class:', femaleClass);
        console.log('  Background:', femaleBg.includes('female') ? '✅ FEMALE avatar' : '❌ Not female');

        const femaleActive = await page.evaluate(() =>
            document.getElementById('switch-female').classList.contains('active')
        );
        console.log('  Female button active:', femaleActive ? '✅ YES' : '❌ NO');
        console.log('');

        // Test 3: Click Male button
        console.log('TEST 3: Clicking MALE button...');
        await page.click('#switch-male');
        await page.waitForTimeout(500);

        const backToMaleClass = await page.evaluate(() => document.body.className);
        const backToMaleBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundImage);
        console.log('  Body class:', backToMaleClass);
        console.log('  Background:', backToMaleBg.includes('male') ? '✅ MALE avatar' : '❌ Not male');

        const maleActiveAgain = await page.evaluate(() =>
            document.getElementById('switch-male').classList.contains('active')
        );
        console.log('  Male button active:', maleActiveAgain ? '✅ YES' : '❌ NO');
        console.log('');

        // Test 4: Keyboard shortcut 'f'
        console.log('TEST 4: Testing keyboard shortcut "f"...');
        await page.keyboard.press('f');
        await page.waitForTimeout(500);

        const keyboardFClass = await page.evaluate(() => document.body.className);
        console.log('  Body class:', keyboardFClass);
        console.log('  Result:', keyboardFClass.includes('female') ? '✅ FEMALE avatar' : '❌ Failed');
        console.log('');

        // Test 5: Keyboard shortcut 'm'
        console.log('TEST 5: Testing keyboard shortcut "m"...');
        await page.keyboard.press('m');
        await page.waitForTimeout(500);

        const keyboardMClass = await page.evaluate(() => document.body.className);
        console.log('  Body class:', keyboardMClass);
        console.log('  Result:', keyboardMClass.includes('male') ? '✅ MALE avatar' : '❌ Failed');
        console.log('');

        // Final summary
        console.log('═══════════════════════════════════════');
        console.log('📊 TEST SUMMARY:');
        console.log('═══════════════════════════════════════');

        const allTests = [
            initialClass.includes('male'),
            femaleClass.includes('female') && femaleActive,
            backToMaleClass.includes('male') && maleActiveAgain,
            keyboardFClass.includes('female'),
            keyboardMClass.includes('male')
        ];

        const passed = allTests.filter(t => t).length;
        const total = allTests.length;

        console.log(`Tests passed: ${passed}/${total}`);
        console.log(passed === total ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');
        console.log('═══════════════════════════════════════\n');

        // Keep browser open for 5 seconds to see the result
        console.log('Keeping browser open for 5 seconds...');
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 Test completed!');
    }
})();
