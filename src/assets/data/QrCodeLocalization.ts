/*
 * @Author: ShawnPhang
 * @Date: 2022-03-16 11:38:48
 * @Description:
 * @LastEditors: ShawnPhang, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-01 20:55:51
 */

export type QrCodeLocalizationData = {
  dotColorTypes: {
    key: string
    value: string
  }[]
  dotTypes: {
    key: string
    value: string
  }[]
}

export default {
  dotColorTypes: [
    {
      key: 'single',
      value: 'Solid',
    },
    {
      key: 'gradient',
      value: 'Gradient',
    },
  ],
  dotTypes: [
    {
      key: 'dots',
      value: 'Dots',
    },
    {
      key: 'rounded',
      value: 'Rounded',
    },
    {
      key: 'classy',
      value: 'Classic',
    },
    {
      key: 'classy-rounded',
      value: 'Soft corners',
    },
    {
      key: 'square',
      value: 'Square',
    },
    {
      key: 'extra-rounded',
      value: 'Fancy',
    },
  ],
} as QrCodeLocalizationData
