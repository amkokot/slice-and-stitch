param(
  [string]$RenderRoot = (Join-Path $PSScriptRoot '..\assets\characters-v3\modular-v4\render')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$basePath = Join-Path $RenderRoot 'preset-medium-base-v1.png'
$feetPath = Join-Path $RenderRoot 'base-bare-feet-v1.png'
$upperPath = Join-Path $RenderRoot 'preset-medium-base-upper-v2.png'

$base = [System.Drawing.Bitmap]::new($basePath)
$feet = [System.Drawing.Bitmap]::new($feetPath)
$upper = [System.Drawing.Bitmap]::new(
  $base.Width,
  $base.Height,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$upper.SetResolution(96, 96)

# The current full base was composited from the body plus this exact feet
# plate. Remove that plate's alpha footprint to make footwear a true
# replacement layer. Re-adding the feet plate reconstructs the barefoot base;
# omitting it leaves clean room for closed shoes and their ankle/sock pixels.
for ($y = 0; $y -lt $base.Height; $y++) {
  for ($x = 0; $x -lt $base.Width; $x++) {
    $basePixel = $base.GetPixel($x, $y)
    if ($basePixel.A -eq 0) { continue }

    $feetAlpha = $feet.GetPixel($x, $y).A
    if ($feetAlpha -eq 0) {
      $upper.SetPixel($x, $y, $basePixel)
    }
  }
}

$upper.Save($upperPath, [System.Drawing.Imaging.ImageFormat]::Png)
$upper.Dispose()
$feet.Dispose()
$base.Dispose()

Write-Host "Built preset-medium-base-upper-v2.png"
