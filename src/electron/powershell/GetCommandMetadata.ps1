[CmdletBinding(DefaultParameterSetName = 'Single')]
param (
  [string][Parameter(Mandatory = $true, Position = 0, ParameterSetName = 'Single')]$scriptPath,

  # File containing one script path per line. Parses all scripts in one process and emits a JSON array.
  [string][Parameter(Mandatory = $true, ParameterSetName = 'Batch')]$scriptListPath
)

function Get-ScriptMetadata {
  param (
    [string]$scriptPath
  )

  $help = Get-Help $scriptPath -Full
  $description = $null
  if ($help -and ($help.description -ne $null)) {
    $description = ''
    foreach ($node in $help.description) {
      if ($node.Text -ne $null) {
        $description += $node.Text
      }
    }
  }

  $numberTypes = @( 'Byte', 'Int32', 'Int64', 'Single', 'Double', 'Decimal' )
  $scriptRootRegex = [regex]::new('\$PSScriptRoot', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  $directory = [System.IO.Path]::GetDirectoryName($scriptPath)
  $metadata = Get-Command $scriptPath
  $parameters = [System.Collections.ArrayList]::new()
  foreach ($param in $metadata.ScriptBlock.Ast.ParamBlock.Parameters) {
    $name = $param.Name.ToString().TrimStart('$')

    $default = $null
    $defaultText = $param.DefaultValue.Extent.Text
    if (($defaultText -ne $null) -and ($defaultText -ne '@()')) {
      $defaultText = $scriptRootRegex.Replace($defaultText, $directory)
      $default = Invoke-Expression $defaultText
    }

    $x = $metadata.Parameters.$name;
    $validation = @{ }
    $type = $x.ParameterType.Name
    $itemType = $null
    if ($x.ParameterType.BaseType.Name -eq 'Array') {
      $itemType = $type.Replace('[]', '')
      $type = 'Array'
    }
    elseif ($type -eq 'SwitchParameter') {
      $type = 'Switch'
    }
    elseif ($numberTypes.Contains($type)) {
      $type = 'Number'
    }
    elseif ($type -eq 'DateTime') {
      $type = 'Date'
    }

    foreach ($attribute in $x.Attributes) {
      $attributeType = $attribute.TypeId.Name
      switch ($attributeType) {
        "ParameterAttribute" {
          if ($attribute.Mandatory) {
            $validation.required = $true
          }
        }
        "ValidateSetAttribute" {
          $validation.set = $attribute.ValidValues
          $type = 'Set'
        }
        Default {}
      }
    }

    $parameter = @{
      name = $name
      type = $type
      validation = $validation
      default = $default
    }

    if ($itemType -ne $null) {
      $parameter.itemType = $itemType
    }

    $parameters.Add($parameter) | Out-Null
  }

  @{
    description = $description
    params = $parameters
  }
}

if ($PSCmdlet.ParameterSetName -eq 'Batch') {
  # One prefixed JSON line per script, written as each completes, so results survive if a later script
  # terminates the process (e.g. `exit` in a default value) and stray host output cannot corrupt them.
  # ReadAllLines returns plain strings; Get-Content adds PS* note properties that ConvertTo-Json would serialize.
  $paths = [System.IO.File]::ReadAllLines($scriptListPath, [System.Text.Encoding]::UTF8)
  for ($index = 0; $index -lt $paths.Length; $index++) {
    $path = $paths[$index]
    try {
      $result = @{
        index = $index
        path = $path
        metadata = Get-ScriptMetadata $path
      }
    }
    catch {
      $result = @{
        index = $index
        path = $path
        error = $_.Exception.Message
      }
    }

    '##PowerRunnerMetadata##' + (ConvertTo-Json -InputObject $result -Depth 5 -Compress)
  }
}
else {
  Get-ScriptMetadata $scriptPath | ConvertTo-Json -Depth 4 -Compress
}