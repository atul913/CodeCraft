const { runInDocker } = require('./judge.service')

// judge code against an array of test cases
// returns per-test-case results and overall verdict
async function judgeSubmission(code, language, testCases, timeLimit) {
  const results  = []
  let   verdict  = 'Accepted'
  let   totalRuntimeMs = 0

  for (const tc of testCases) {
    const result = await runInDocker(code, language, tc.input, timeLimit)

    totalRuntimeMs += result.runtimeMs

    if (result.verdict !== 'OK') {
      // non-OK verdict — stop running remaining test cases
      // same as how Codeforces stops on first failure
      results.push({
        testCaseId: tc.id,
        status:     result.verdict,
        output:     result.output,        // ← program output
        expected:   tc.expectedOutput.trim(), // ← expected
        error:      result.error,
        runtimeMs:  result.runtimeMs   
      })
      verdict = result.verdict
      break
    }

    function normalizeOutput(str) {
      return str
        .split('\n')
        .map(line => line.trimEnd())   // remove trailing spaces per line
        .join('\n')
        .trim()                        // remove leading/trailing newlines
    }

    const passed = normalizeOutput(result.output) === normalizeOutput(tc.expectedOutput)

    results.push({
      testCaseId: tc.id,
      status:     passed ? 'Passed' : 'Failed',
      output:     result.output,
      expected:   tc.expectedOutput.trim(),
      error:      '',
      runtimeMs:  result.runtimeMs   
    })

    if (!passed) {
      verdict = 'Wrong Answer'
      break
      // stop on first wrong answer — same as Codeforces
    }
  }

  const passedCount = results.filter(r => r.status === 'Passed').length

  return {
    verdict,
    results,
    passedCount,
    totalTestCases:  testCases.length,
    runtimeMs:       Math.round(totalRuntimeMs / results.length || 0),
    errorMessage:    results.find(r => r.error)?.error || ''
  }
}

module.exports = { judgeSubmission }