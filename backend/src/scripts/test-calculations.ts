// ===== 檔案 14: backend/src/scripts/test-calculations.ts (最後一個缺失檔案) =====

import { BMIService } from '../projects/bmi/services/BMIService';
import { TDEEService } from '../projects/tdee/services/TDEEService';
import { BMI_TEST_CASES, TDEE_TEST_CASES, validateBMIResult, validateTDEEResult, generateRandomBMIData, generateRandomTDEEData } from '../utils/api-test';
import { logger } from '../utils/logger';

export class CalculationTester {
  private bmiService: BMIService;
  private tdeeService: TDEEService;

  constructor() {
    this.bmiService = new BMIService();
    this.tdeeService = new TDEEService();
  }

  // 測試 BMI 計算邏輯
  async testBMICalculations(): Promise<{ passed: number; failed: number; results: any[] }> {
    console.log('\n🧮 Testing BMI Calculations...');
    
    const testUserId = 'test-user-id'; // 模擬用戶 ID
    const results = [];
    let passed = 0;
    let failed = 0;
    
    for (const testCase of BMI_TEST_CASES) {
      try {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`   Input: ${testCase.data.height}cm, ${testCase.data.weight}kg${testCase.data.age ? `, ${testCase.data.age}y` : ''}${testCase.data.gender ? `, ${testCase.data.gender}` : ''}`);
        
        const result = await this.bmiService.calculate(testUserId, testCase.data);
        
        if (result.success && result.data) {
          console.log(`   Result: BMI ${result.data.bmi} (${result.data.category})`);
          console.log(`   Expected: BMI ${testCase.expectedBMI} (${testCase.expectedCategory})`);
          
          const validation = validateBMIResult(result.data, testCase);
          const status = validation.isValid ? '✅ PASS' : '❌ FAIL';
          console.log(`   Status: ${status}`);
          console.log(`   Details: ${validation.details}`);
          
          if (validation.isValid) {
            passed++;
          } else {
            failed++;
          }
          
          results.push({
            test: testCase.name,
            passed: validation.isValid,
            expected: testCase.expectedBMI,
            actual: result.data.bmi,
            details: validation.details
          });
          
          if (result.data.recommendations.length > 0) {
            console.log(`   Recommendation: ${result.data.recommendations[0]}`);
          }
        } else {
          console.log(`   Status: ❌ FAIL - ${result.error}`);
          failed++;
          results.push({
            test: testCase.name,
            passed: false,
            error: result.error
          });
        }
        
      } catch (error) {
        console.log(`   Status: ❌ ERROR - ${error.message}`);
        failed++;
        results.push({
          test: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }

    return { passed, failed, results };
  }

  // 測試 TDEE 計算邏輯
  async testTDEECalculations(): Promise<{ passed: number; failed: number; results: any[] }> {
    console.log('\n🔥 Testing TDEE Calculations...');
    
    const testUserId = 'test-user-id'; // 模擬用戶 ID
    const results = [];
    let passed = 0;
    let failed = 0;
    
    for (const testCase of TDEE_TEST_CASES) {
      try {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`   Input: ${testCase.data.height}cm, ${testCase.data.weight}kg, ${testCase.data.age}y, ${testCase.data.gender}, ${testCase.data.activity_level}`);
        
        const result = await this.tdeeService.calculate(testUserId, testCase.data);
        
        if (result.success && result.data) {
          console.log(`   Result: BMR ${result.data.bmr}, TDEE ${result.data.tdee}, BMI ${result.data.bmi}`);
          console.log(`   Expected: BMR ${testCase.expectedBMR}, TDEE ${testCase.expectedTDEE}, BMI ${testCase.expectedBMI}`);
          
          const validation = validateTDEEResult(result.data, testCase);
          const status = validation.isValid ? '✅ PASS' : '❌ FAIL';
          console.log(`   Status: ${status}`);
          console.log(`   Details: ${validation.details}`);
          
          if (validation.isValid) {
            passed++;
          } else {
            failed++;
          }
          
          results.push({
            test: testCase.name,
            passed: validation.isValid,
            expected: {
              bmr: testCase.expectedBMR,
              tdee: testCase.expectedTDEE,
              bmi: testCase.expectedBMI
            },
            actual: {
              bmr: result.data.bmr,
              tdee: result.data.tdee,
              bmi: result.data.bmi
            },
            details: validation.details
          });
          
          console.log(`   BMI Category: ${result.data.bmi_category}`);
          console.log(`   Activity: ${result.data.activity_description}`);
          console.log(`   Calories: Lose ${result.data.recommendations.weight_loss}, Maintain ${result.data.recommendations.maintenance}, Gain ${result.data.recommendations.weight_gain}`);
          
        } else {
          console.log(`   Status: ❌ FAIL - ${result.error}`);
          failed++;
          results.push({
            test: testCase.name,
            passed: false,
            error: result.error
          });
        }
        
      } catch (error) {
        console.log(`   Status: ❌ ERROR - ${error.message}`);
        failed++;
        results.push({
          test: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }

    return { passed, failed, results };
  }

  // 測試隨機數據
  async testRandomCalculations(count: number = 10): Promise<void> {
    console.log(`\n🎲 Testing ${count} Random Calculations...`);
    
    const testUserId = 'test-user-id';
    
    for (let i = 1; i <= count; i++) {
      try {
        console.log(`\n📋 Random Test ${i}:`);
        
        // 隨機選擇測試 BMI 或 TDEE
        if (Math.random() > 0.5) {
          const randomData = generateRandomBMIData();
          console.log(`   BMI Test: ${randomData.height}cm, ${randomData.weight}kg${randomData.age ? `, ${randomData.age}y` : ''}${randomData.gender ? `, ${randomData.gender}` : ''}`);
          
          const result = await this.bmiService.calculate(testUserId, randomData);
          if (result.success && result.data) {
            console.log(`   ✅ BMI: ${result.data.bmi} (${result.data.category})`);
          } else {
            console.log(`   ❌ BMI calculation failed: ${result.error}`);
          }
        } else {
          const randomData = generateRandomTDEEData();
          console.log(`   TDEE Test: ${randomData.height}cm, ${randomData.weight}kg, ${randomData.age}y, ${randomData.gender}, ${randomData.activity_level}`);
          
          const result = await this.tdeeService.calculate(testUserId, randomData);
          if (result.success && result.data) {
            console.log(`   ✅ BMR: ${result.data.bmr}, TDEE: ${result.data.tdee}, BMI: ${result.data.bmi}`);
          } else {
            console.log(`   ❌ TDEE calculation failed: ${result.error}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Random test ${i} error: ${error.message}`);
      }
    }
  }

  // 測試邊界值
  async testBoundaryValues(): Promise<void> {
    console.log('\n🔬 Testing Boundary Values...');
    
    const testUserId = 'test-user-id';
    
    const boundaryTests = [
      // 最小值
      { name: 'Minimum Values', data: { height: 50, weight: 10, age: 1, gender: 'male', activity_level: 'sedentary' } },
      // 最大值
      { name: 'Maximum Values', data: { height: 300, weight: 500, age: 150, gender: 'female', activity_level: 'very_active' } },
      // 極低 BMI
      { name: 'Very Low BMI', data: { height: 200, weight: 30, age: 25, gender: 'male', activity_level: 'moderate' } },
      // 極高 BMI
      { name: 'Very High BMI', data: { height: 150, weight: 150, age: 40, gender: 'female', activity_level: 'sedentary' } }
    ];

    for (const test of boundaryTests) {
      try {
        console.log(`\n📋 ${test.name}:`);
        console.log(`   Input: ${test.data.height}cm, ${test.data.weight}kg, ${test.data.age}y, ${test.data.gender}, ${test.data.activity_level}`);
        
        const result = await this.tdeeService.calculate(testUserId, test.data);
        if (result.success && result.data) {
          console.log(`   ✅ BMR: ${result.data.bmr}, TDEE: ${result.data.tdee}, BMI: ${result.data.bmi} (${result.data.bmi_category})`);
        } else {
          console.log(`   ❌ Calculation failed: ${result.error}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Boundary test error: ${error.message}`);
      }
    }
  }

  // 性能測試
  async performanceTest(iterations: number = 100): Promise<void> {
    console.log(`\n⚡ Performance Test (${iterations} iterations)...`);
    
    const testUserId = 'test-user-id';
    const bmiTimes: number[] = [];
    const tdeeTimes: number[] = [];
    
    // BMI 性能測試
    for (let i = 0; i < iterations; i++) {
      const data = generateRandomBMIData();
      const startTime = process.hrtime.bigint();
      
      await this.bmiService.calculate(testUserId, data);
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 轉換為毫秒
      bmiTimes.push(duration);
    }
    
    // TDEE 性能測試
    for (let i = 0; i < iterations; i++) {
      const data = generateRandomTDEEData();
      const startTime = process.hrtime.bigint();
      
      await this.tdeeService.calculate(testUserId, data);
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 轉換為毫秒
      tdeeTimes.push(duration);
    }
    
    // 計算統計
    const avgBMI = bmiTimes.reduce((a, b) => a + b, 0) / bmiTimes.length;
    const avgTDEE = tdeeTimes.reduce((a, b) => a + b, 0) / tdeeTimes.length;
    const maxBMI = Math.max(...bmiTimes);
    const maxTDEE = Math.max(...tdeeTimes);
    const minBMI = Math.min(...bmiTimes);
    const minTDEE = Math.min(...tdeeTimes);
    
    console.log(`\n📊 Performance Results:`);
    console.log(`   BMI Calculations:`);
    console.log(`     Average: ${avgBMI.toFixed(2)}ms`);
    console.log(`     Min: ${minBMI.toFixed(2)}ms`);
    console.log(`     Max: ${maxBMI.toFixed(2)}ms`);
    console.log(`   TDEE Calculations:`);
    console.log(`     Average: ${avgTDEE.toFixed(2)}ms`);
    console.log(`     Min: ${minTDEE.toFixed(2)}ms`);
    console.log(`     Max: ${maxTDEE.toFixed(2)}ms`);
  }

  // 執行所有測試
  async runAllTests(): Promise<void> {
    try {
      console.log('🚀 Starting Calculation Tests...');
      
      const bmiResults = await this.testBMICalculations();
      const tdeeResults = await this.testTDEECalculations();
      
      await this.testRandomCalculations(5);
      await this.testBoundaryValues();
      await this.performanceTest(50);
      
      console.log('\n📊 Test Summary:');
      console.log(`   BMI Tests: ${bmiResults.passed} passed, ${bmiResults.failed} failed`);
      console.log(`   TDEE Tests: ${tdeeResults.passed} passed, ${tdeeResults.failed} failed`);
      console.log(`   Total: ${bmiResults.passed + tdeeResults.passed} passed, ${bmiResults.failed + tdeeResults.failed} failed`);
      
      const totalTests = bmiResults.passed + bmiResults.failed + tdeeResults.passed + tdeeResults.failed;
      const passRate = ((bmiResults.passed + tdeeResults.passed) / totalTests * 100).toFixed(1);
      console.log(`   Pass Rate: ${passRate}%`);
      
      if (bmiResults.failed > 0 || tdeeResults.failed > 0) {
        console.log('\n❌ Some tests failed. Check the details above.');
        process.exit(1);
      } else {
        console.log('\n✅ All calculation tests passed!');
      }
      
    } catch (error) {
      console.error('\n❌ Calculation tests failed:', error);
      throw error;
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const tester = new CalculationTester();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'bmi':
      tester.testBMICalculations().then(results => {
        console.log(`\nBMI Tests completed: ${results.passed} passed, ${results.failed} failed`);
      }).catch(console.error);
      break;
    case 'tdee':
      tester.testTDEECalculations().then(results => {
        console.log(`\nTDEE Tests completed: ${results.passed} passed, ${results.failed} failed`);
      }).catch(console.error);
      break;
    case 'random':
      const count = parseInt(process.argv[3]) || 10;
      tester.testRandomCalculations(count).catch(console.error);
      break;
    case 'boundary':
      tester.testBoundaryValues().catch(console.error);
      break;
    case 'performance':
      const iterations = parseInt(process.argv[3]) || 100;
      tester.performanceTest(iterations).catch(console.error);
      break;
    case 'all':
    default:
      tester.runAllTests().catch(console.error);
      break;
  }
}