<template type="text/pug">
	h1 Hello {name}
  br
  input(bind:value="{name}")
</template>

<script type="text/typescript">
  export let name: string = ''

  $: console.log(name)
</script>

<style type="text/stylus">
	h1
		color blue
</style>