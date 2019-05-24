<template lang="pug">
	h1 Hello {name}
  input(bind:value="{name}")
</template>

<script lang="ts">
  export let name: string = ''

  $: console.log(name)
</script>

<style lang="stylus">
	h1
		color blue
</style>