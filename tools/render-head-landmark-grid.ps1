param(
  [string]$AssetRoot = (Join-Path $PSScriptRoot '..\assets\characters-v3\identity-toppers'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\assets\characters-v3\identity-toppers\qa-head-landmark-grid.png')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sources = @(
  (Join-Path $AssetRoot 'forward-head-atlas-cartoon-a.png'),
  (Join-Path $AssetRoot 'forward-head-atlas-cartoon-b.png')
)
$canvas = [System.Drawing.Bitmap]::new(1536, 2048, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$canvas.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#2c211f'))
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$linePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(150, 45, 210, 235), 2)
$centerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(190, 255, 220, 80), 2)
$font = [System.Drawing.Font]::new('Consolas', 11, [System.Drawing.FontStyle]::Bold)
$labelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)

for ($atlasIndex = 0; $atlasIndex -lt $sources.Count; $atlasIndex++) {
  $atlas = [System.Drawing.Bitmap]::new($sources[$atlasIndex])
  $atlasTop = $atlasIndex * 1024
  $graphics.DrawImage($atlas, 0, $atlasTop, 1536, 1024)
  $atlas.Dispose()

  for ($row = 0; $row -lt 2; $row++) {
    for ($column = 0; $column -lt 3; $column++) {
      $cellX = $column * 512
      $cellY = $atlasTop + ($row * 512)
      $graphics.DrawLine($centerPen, $cellX + 256, $cellY, $cellX + 256, $cellY + 512)
      foreach ($localY in 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480) {
        $graphics.DrawLine($linePen, $cellX, $cellY + $localY, $cellX + 512, $cellY + $localY)
        $graphics.DrawString([string]$localY, $font, $labelBrush, $cellX + 4, $cellY + $localY + 2)
      }
    }
  }
}

$labelBrush.Dispose()
$font.Dispose()
$centerPen.Dispose()
$linePen.Dispose()
$graphics.Dispose()
$canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
Write-Output (Resolve-Path $OutputPath)
