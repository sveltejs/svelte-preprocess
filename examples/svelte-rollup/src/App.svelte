<template type="text/pug">
	h1 Hello {name}
  br
  input(bind:value="{name}")

  Nested
</template>

<script type="text/typescript">
  import Nested from './Nested.svelte'
  export let name: string = ''

  $: console.log(name)
</script>

<style type="text/stylus">
	h1
		color blue
</style>