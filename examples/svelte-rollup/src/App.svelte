<template type="text/pug">
  h1 Hello {label}
  br
  input(bind:value="{label}")

  Nested
</template>

<script type="text/typescript">
  import Nested from './Nested.svelte'
  export let label: string = ''

  $: console.log(label)
</script>

<style type="text/stylus">
	h1
		color blue
</style>