param(
  [string]$RenderRoot = (Join-Path $PSScriptRoot '..\assets\characters-v3\modular-v4\render'),
  [string]$OutputName = 'qa-modular-pizzeria-v3.png',
  [string[]]$LayerNames = @(
    'preset-medium-base-upper-v2.png',
    'bottom-olive-onbody-v2.png',
    'shoes-canvas-onbody-v2.png',
    'top-ivory-onbody-v2.png',
    'apron-tomato-onbody-v2.png'
  )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$canvas = [System.Drawing.Bitmap]::new(
  1024,
  1536,
  [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
)
$canvas.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.Clear([System.Drawing.Color]::FromArgb(255, 249, 241, 231))
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

foreach ($layerName in $LayerNames) {
  $layer = [System.Drawing.Bitmap]::new((Join-Path $RenderRoot $layerName))
  $graphics.DrawImage($layer, 0, 0, 1024, 1536)
  $layer.Dispose()
}

$graphics.Dispose()
$outputPath = Join-Path $RenderRoot $OutputName
$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()

Write-Host "Built $outputPath"
