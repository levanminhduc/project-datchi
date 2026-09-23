import { access, mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { constants as fsConstants } from 'fs'
import { dirname, resolve, sep } from 'path'

const BUCKET = 'guide-images'

function getStorageDir(): string {
  const dir = process.env.STORAGE_DIR
  if (!dir || dir.trim() === '') {
    throw new Error(
      'STORAGE_DIR is not set. The backend requires a writable directory to store guide images.'
    )
  }
  return dir
}

function getBucketDir(): string {
  return resolve(getStorageDir(), BUCKET)
}

let readyPromise: Promise<void> | null = null

async function ensureStorageReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const bucketDir = getBucketDir()
      try {
        await mkdir(bucketDir, { recursive: true })
      } catch (err) {
        throw new Error(
          `STORAGE_DIR is not usable: cannot create directory "${bucketDir}" (${(err as Error).message})`
        )
      }
      try {
        await access(bucketDir, fsConstants.W_OK)
      } catch (err) {
        throw new Error(
          `STORAGE_DIR is not usable: directory "${bucketDir}" is not writable (${(err as Error).message})`
        )
      }
    })().catch((err) => {
      readyPromise = null
      throw err
    })
  }
  return readyPromise
}

function resolveObjectPath(relativePath: string): string {
  if (!relativePath || relativePath.includes('..')) {
    throw new Error('Đường dẫn không hợp lệ')
  }
  const bucketDir = getBucketDir()
  const fullPath = resolve(bucketDir, relativePath)
  if (fullPath !== bucketDir && !fullPath.startsWith(bucketDir + sep)) {
    throw new Error('Đường dẫn không hợp lệ')
  }
  return fullPath
}

export async function putObject(
  relativePath: string,
  data: Buffer,
  opts: { upsert?: boolean } = {}
): Promise<void> {
  await ensureStorageReady()
  const fullPath = resolveObjectPath(relativePath)
  await mkdir(dirname(fullPath), { recursive: true })
  const flag = opts.upsert ? 'w' : 'wx'
  await writeFile(fullPath, data, { flag })
}

export async function getObject(relativePath: string): Promise<Buffer | null> {
  await ensureStorageReady()
  const fullPath = resolveObjectPath(relativePath)
  try {
    return await readFile(fullPath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

export async function removeObjects(relativePaths: string[]): Promise<void> {
  if (!relativePaths || relativePaths.length === 0) return
  await ensureStorageReady()
  for (const relativePath of relativePaths) {
    const fullPath = resolveObjectPath(relativePath)
    try {
      await unlink(fullPath)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        continue
      }
      throw err
    }
  }
}

export { resolveObjectPath }
