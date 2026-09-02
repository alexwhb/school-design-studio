import app_config from '@/config'
export const config = app_config

type TComObj = Record<string,any>

export const isInArray = (arr: (string | number)[], value: (string | number)) => {
  const index = arr.indexOf(value)
  if (index >= 0) {
    return index
  }
  return false
}

export const deleteSome = <R extends TComObj, T extends TComObj = TComObj>(obj: T, arr: string[]) => {
  arr.forEach((key) => {
    delete obj[key]
  })
  return obj as R extends T ? R : Partial<T>
}

export const pickSome = <R extends TComObj, T extends TComObj = TComObj>(obj: T, arr: string[]) => {
  const newObj: Record<string, any> = {}
  arr.forEach((key) => {
    newObj[key] = obj[key]
  })
  return newObj as R extends T ? R : Partial<T>
}

export const rndNum = (n: number, m: number) => {
  const random = Math.floor(Math.random() * (m - n + 1) + n)
  return random
}

export const findClosestNumber = (target: number, numbers: number[]) => {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('The list cannot be empty')
  }
  let closestNumber = numbers[0]
  let minDifference = Math.abs(target - closestNumber)
  for (let i = 1; i < numbers.length; i++) {
    const currentNumber = numbers[i]
    const currentDifference = Math.abs(target - currentNumber)
    if (currentDifference < minDifference) {
      closestNumber = currentNumber
      minDifference = currentDifference
    }
  }
  return closestNumber
}

export default {}
