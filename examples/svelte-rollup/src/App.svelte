<template lang="pug">
	h1 Hello
</template>

<script lang="ts">
  export let name: number = 'ab'

  $: console.log(name)
</script>

<style lang="stylus">
	h1
		color blue
</style>