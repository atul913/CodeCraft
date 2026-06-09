const { exec } = require('child_process')
const fs   = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

// temp folder at project root
const TEMP_DIR = path.join(__dirname, '../../temp')
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR)

// Docker image per language
const IMAGES = {
  python:     'python:3.11-slim',
  javascript: 'node:18-slim',
  cpp:        'gcc:13',
  java:       'eclipse-temurin:17-jdk-alpine'
}

// File extension per language
const EXTENSIONS = {
  python:     'py',
  javascript: 'js',
  cpp:        'cpp',
  java:       'java'
}

// Build the shell command that runs inside the container
function buildRunCommand(language, filename) {
  switch (language) {
    case 'python':
      return `python3 /code/${filename}`

    case 'javascript':
      return `node /code/${filename}`

    case 'cpp': {
      // compile first, then run
      // if compile fails, stderr has the error and we catch it
      const binary = filename.replace('.cpp', '')
      return `g++ /code/${filename} -o /code/${binary} && /code/${binary}`
    }

    case 'java':
      // java filename must be Main.java, class must be Main
      return `javac /code/${filename} && java -cp /code Main`

    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}

// Run code inside Docker for a single test case
function runInDocker(code, language, input, timeLimit) {
  return new Promise((resolve) => {
    const id       = uuidv4()
    const ext      = EXTENSIONS[language]

    // java filename MUST be Main.java
    const filename = language === 'java' ? 'Main.java' : `${id}.${ext}`
    const filepath = path.join(TEMP_DIR, language === 'java' ? filename : filename)

    // for java we need a unique subfolder per run
    // because filename is always Main.java — concurrent runs would conflict
    let codeDir = TEMP_DIR
    if (language === 'java') {
      codeDir = path.join(TEMP_DIR, id)
      fs.mkdirSync(codeDir, { recursive: true })
    }

    const actualFilepath = path.join(codeDir, filename)
    const inputFilepath  = path.join(codeDir, `input.txt`)

    // write code and input to disk
    fs.writeFileSync(actualFilepath, code)
    fs.writeFileSync(inputFilepath, input || '')

    const runCmd = buildRunCommand(language, filename)

    // docker run flags:
    // --rm             → delete container immediately after exit
    // --memory="256m"  → max 256MB RAM
    // --cpus="0.5"     → max half a CPU core
    // --pids-limit=50  → max 50 processes (blocks fork bombs)
    // --network none   → no internet access from inside container
    // -v               → mount our codeDir as /code inside container
    // sh -c            → run the compile+execute command as a shell string
    const dockerCmd = [
      'docker run --rm',
      '--memory="256m"',
      '--cpus="0.5"',
      '--pids-limit=50',
      '--network none',
      `-v "${codeDir}:/code"`,
      IMAGES[language],
      `sh -c "${runCmd} < /code/input.txt"`
    ].join(' ')

    const startTime = Date.now()

    exec(dockerCmd, { timeout: timeLimit + 10000 }, (error, stdout, stderr) => {
      const runtimeMs = Date.now() - startTime

      // cleanup
      cleanup(codeDir, id, language)

      // timeout — process was killed
      if (error && (error.killed || error.signal === 'SIGTERM')) {
        return resolve({
          verdict:  'Time Limit Exceeded',
          output:   '',
          error:    '',
          runtimeMs
        })
      }

      // compile error — stderr has output but no stdout
      if (stderr && !stdout) {
        return resolve({
          verdict:  'Compile Error',
          output:   '',
          error:    stderr.trim(),
          runtimeMs
        })
      }

      // runtime error — process exited with non-zero code
      if (error && error.code !== 0) {
        return resolve({
          verdict:  'Runtime Error',
          output:   '',
          error:    stderr.trim() || error.message,
          runtimeMs
        })
      }

      // success
      resolve({
        verdict:  'OK',
        output:   stdout.trim(),
        error:    '',
        runtimeMs
      })
    })
  })
}

// cleanup temp files after execution
function cleanup(codeDir, id, language) {
  try {
    if (language === 'java') {
      // remove entire subfolder
      fs.rmSync(codeDir, { recursive: true, force: true })
    } else {
      // remove individual files
      const ext = EXTENSIONS[language]
      const files = [
        path.join(codeDir, `${id}.${ext}`),
        path.join(codeDir, `${id}.txt`),
        path.join(codeDir, id) // cpp binary
      ]
      files.forEach(f => { try { fs.unlinkSync(f) } catch {} })
    }
  } catch {}
}

module.exports = { runInDocker }