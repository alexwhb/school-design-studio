<!--
 * @Author: ShawnPhang
 * @Date: 2022-09-27 15:08:54
 * @Description:  
 * @LastEditors: ShawnPhang
 * @LastEditTime: 2022-09-27 15:52:07
-->
<template>
  <div class="inner-tool-bar">
    <slot />
  </div>
</template>

<style lang="less" scoped>
.inner-tool-bar {
  position: fixed;
  z-index: 999999;
  margin-top: -57px;

  padding: 5px;
  font-size: 13px;
  background: @popover;
  border-radius: 3px;
  box-shadow: @shadow-pop;
  display: flex;
  align-items: center;
}
</style>
