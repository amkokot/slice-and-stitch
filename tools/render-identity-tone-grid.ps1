param(
  [string]$RenderRoot = (Join-Path $PSScriptRoot '..\assets\characters-v3\modular-v4\render'),
  [string]$OutputName = 'qa-identity-tone-grid-v3.png'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$heads = @('head-01', 'head-02', 'head-03', 'head-04', 'head-05', 'head-06', 'head-07', 'head-08', 'head-09', 'head-10', 'head-11', 'head-12')
$tones = @('light-golden', 'warm-medium', 'deep-golden', 'deep')

$grid = [System.Drawing.Bitmap]::new(1120, 3240, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$grid.SetResolution(96, 96)
$gridGraphics = [System.Drawing.Graphics]::FromImage($grid)
$gridGraphics.Clear([System.Drawing.Color]::FromArgb(255, 249, 241, 231))
$gridGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

for ($headIndex = 0; $headIndex -lt $heads.Count; $headIndex++) {
  for ($toneIndex = 0; $toneIndex -lt $tones.Count; $toneIndex++) {
  $head = $heads[$headIndex]
  $tone = $tones[$toneIndex]
  $character = [System.Drawing.Bitmap]::new(1024, 1536, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $characterGraphics = [System.Drawing.Graphics]::FromImage($character)
  $characterGraphics.Clear([System.Drawing.Color]::Transparent)
  $layers = @(
    "body-shared-$tone-v2.png",
    "$head-$tone-v3.png",
    'bottom-olive-onbody-v3.png',
    'shoes-canvas-onbody-v3.png',
    'top-ivory-onbody-v3.png'
  )
  foreach ($layerName in $layers) {
    $layer = [System.Drawing.Bitmap]::new((Join-Path $RenderRoot $layerName))
    $characterGraphics.DrawImage($layer, 0, 0, 1024, 1536)
    $layer.Dispose()
  }
  $characterGraphics.Dispose()

  $destination = [System.Drawing.Rectangle]::new(10 + $toneIndex * 280, 10 + $headIndex * 270, 260, 244)
  $source = [System.Drawing.Rectangle]::new(262, 0, 500, 470)
  $gridGraphics.DrawImage($character, $destination, $source, [System.Drawing.GraphicsUnit]::Pixel)
  $character.Dispose()
  }
}

$gridGraphics.Dispose()
$outputPath = Join-Path $RenderRoot $OutputName
$grid.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$grid.Dispose()
Write-Host "Built $outputPath"
