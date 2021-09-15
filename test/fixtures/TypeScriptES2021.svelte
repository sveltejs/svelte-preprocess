<script lang="ts">
  let x = true;
  x &&= false;
  x ||= true;

  async function doIt() {
    await (() => true)();
  }
</script>
